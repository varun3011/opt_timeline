import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

// Mock prisma
const mockFindUnique = vi.fn();
const mockCreateLog = vi.fn();
const mockDeleteLog = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    oPTApplication: { findUnique: mockFindUnique },
    unemploymentLog: { create: mockCreateLog, findUnique: mockFindUnique, delete: mockDeleteLog },
  },
}));

// Mock OpenAI
const mockChatCreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCreate } },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("POST /api/unemployment - date validation", () => {
  it("returns 400 when endDate is before startDate", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("@/app/api/unemployment/route");

    const req = new Request("http://localhost/api/unemployment", {
      method: "POST",
      body: JSON.stringify({
        optId: "opt1",
        startDate: "2025-06-10",
        endDate: "2025-06-05",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/end date/i);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/unemployment/route");

    const req = new Request("http://localhost/api/unemployment", {
      method: "POST",
      body: JSON.stringify({ optId: "opt1", startDate: "2025-06-01", endDate: "2025-06-05" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/ai-chat - message cap", () => {
  it("only sends last 20 messages to OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: "reply" } }],
    });

    const { POST } = await import("@/app/api/ai-chat/route");
    const messages = Array.from({ length: 50 }, (_, i) => ({
      role: "user",
      content: `message ${i}`,
    }));

    const req = new Request("http://localhost/api/ai-chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });

    await POST(req);

    const callArgs = mockChatCreate.mock.calls[0][0];
    // +1 for system prompt
    expect(callArgs.messages.length).toBe(21);
    expect(callArgs.messages[callArgs.messages.length - 1].content).toBe("message 49");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/ai-chat/route");

    const req = new Request("http://localhost/api/ai-chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/unemployment", () => {
  it("returns 403 when log belongs to different user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockFindUnique.mockResolvedValue({
      id: "log1",
      optApplication: { userId: "user2" }, // different user
    });

    const { DELETE } = await import("@/app/api/unemployment/route");
    const req = new Request("http://localhost/api/unemployment", {
      method: "DELETE",
      body: JSON.stringify({ id: "log1" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("deletes and returns 200 for correct user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockFindUnique.mockResolvedValue({
      id: "log1",
      optApplication: { userId: "user1" },
    });
    mockDeleteLog.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/unemployment/route");
    const req = new Request("http://localhost/api/unemployment", {
      method: "DELETE",
      body: JSON.stringify({ id: "log1" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockDeleteLog).toHaveBeenCalledWith({ where: { id: "log1" } });
  });
});
