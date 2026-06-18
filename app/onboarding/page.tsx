"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    optStartDate: "",
    optEndDate: "",
    employerName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleStartDateChange(value: string) {
    setForm((f) => ({
      ...f,
      optStartDate: value,
      optEndDate: addMonths(value, 12), // OPT = 12 months
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // STEM OPT = 24 months from OPT end date
  const stemEndDate = addMonths(form.optEndDate, 24);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8">
        <div>
          <h2 className="text-2xl font-semibold">Set up your OPT</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your OPT start date — end dates are calculated automatically</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">OPT Start Date</label>
            <input
              type="date"
              value={form.optStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">OPT End Date <span className="text-muted-foreground font-normal">(12 months)</span></label>
            <input
              type="date"
              value={form.optEndDate}
              onChange={(e) => setForm((f) => ({ ...f, optEndDate: e.target.value }))}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-yellow-500 mt-1">This is an estimate. Use the exact date from your EAD card.</p>
          </div>

          {stemEndDate && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">STEM OPT end date (if extended): </span>
              <span className="font-medium">{new Date(stemEndDate).toLocaleDateString()}</span>
              <span className="text-muted-foreground text-xs block mt-0.5">24 months from OPT end</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Employer Name <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.employerName}
              onChange={(e) => setForm((f) => ({ ...f, employerName: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Start Tracking"}
          </button>
        </form>
      </div>
    </div>
  );
}
