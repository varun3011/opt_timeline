"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ optStartDate: "", optEndDate: "", employerName: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8">
        <div>
          <h2 className="text-2xl font-semibold">Set up your OPT</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your OPT details to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "optStartDate", label: "OPT Start Date", type: "date" },
            { key: "optEndDate", label: "OPT End Date", type: "date" },
            { key: "employerName", label: "Employer Name (optional)", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={key !== "employerName"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
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
