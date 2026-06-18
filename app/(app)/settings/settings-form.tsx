"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsForm({ optStartDate, optEndDate, employerName }: {
  optStartDate: string;
  optEndDate: string;
  employerName: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ optStartDate, optEndDate, employerName });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">OPT Start Date</label>
        <input type="date" value={form.optStartDate}
          onChange={(e) => setForm((f) => ({ ...f, optStartDate: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">OPT End Date</label>
        <input type="date" value={form.optEndDate}
          onChange={(e) => setForm((f) => ({ ...f, optEndDate: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <p className="text-xs text-yellow-500 mt-1">Use the exact date from your EAD card.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Employer Name</label>
        <input type="text" value={form.employerName}
          onChange={(e) => setForm((f) => ({ ...f, employerName: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Saved!</p>}
      <button type="submit" disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
