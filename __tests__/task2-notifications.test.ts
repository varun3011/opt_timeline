import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const { mockFindMany, mockFindFirst, mockCreate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: mockFindMany },
    notification: { findFirst: mockFindFirst, create: mockCreate },
  },
}));

// Mock resend
const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSendEmail },
  })),
}));

import { sendDeadlineNotifications } from "@/lib/notifications";

function makeUser(unemploymentDays: number, daysRemainingOnOpt: number) {
  const now = new Date();
  const optEnd = new Date(now.getTime() + daysRemainingOnOpt * 86400000);
  const optStart = new Date(optEnd.getTime() - 365 * 86400000);

  // Build a log that covers exactly unemploymentDays (inclusive)
  const logs =
    unemploymentDays > 0
      ? [
          {
            id: "log1",
            optApplicationId: "opt1",
            startDate: new Date("2024-01-01"),
            endDate: new Date(
              new Date("2024-01-01").getTime() + (unemploymentDays - 1) * 86400000
            ),
            notes: null,
            createdAt: new Date(),
          },
        ]
      : [];

  return {
    id: "user1",
    name: "Test User",
    email: "test@example.com",
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    optApplication: {
      id: "opt1",
      userId: "user1",
      status: "ACTIVE",
      receiptDate: null,
      approvalDate: null,
      optStartDate: optStart,
      optEndDate: optEnd,
      eadCardReceived: false,
      employerName: null,
      employerEin: null,
      jobTitle: null,
      jobStartDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      stemExtension: null,
      unemployment: logs,
    },
  };
}

beforeEach(() => {
  mockFindMany.mockReset();
  mockFindFirst.mockReset();
  mockCreate.mockReset();
  mockSendEmail.mockReset();

  mockFindFirst.mockResolvedValue(null); // no duplicate
  mockCreate.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({});
});

describe("sendDeadlineNotifications", () => {
  it("sends email for unemployment alert even when daysRemaining > 60", async () => {
    // 85 unemployment days used → 5 remaining (90 - 85 = 5 ≤ 10 threshold) → alert fires
    // daysRemaining = 200 (well above 60, old code would NOT send email here)
    const user = makeUser(85, 200);
    mockFindMany
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce([]);

    await sendDeadlineNotifications();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("sends no email and creates no notification when user has no alerts", async () => {
    // 0 unemployment days, 200 days remaining → no alerts at all
    const user = makeUser(0, 200);
    mockFindMany
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce([]);

    await sendDeadlineNotifications();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not re-create notification for duplicate alert within 24h", async () => {
    const user = makeUser(85, 200);
    mockFindMany
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce([]);
    mockFindFirst.mockResolvedValue({ id: "existing" }); // duplicate found

    await sendDeadlineNotifications();

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("processes users in batches (pagination)", async () => {
    const users = Array.from({ length: 100 }, (_, i) => ({
      ...makeUser(0, 200),
      id: `user${i}`,
      email: `user${i}@example.com`,
    }));
    mockFindMany
      .mockResolvedValueOnce(users)   // first batch: 100 users
      .mockResolvedValueOnce([]);     // second batch: 0 → stop

    await sendDeadlineNotifications();

    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });
});
