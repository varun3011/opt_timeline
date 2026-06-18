"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnemploymentForm({ optId }: { optId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ startDate: "", endDate: "", notes: "" });
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/unemployment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optId, ...form }),
    });
    setForm({ startDate: "", endDate: "", notes: "" });
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h3 className="font-medium">Log Unemployment Period</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date (leave blank if ongoing)</label>
          <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {loading ? "Saving…" : "Log Period"}
      </button>
    </form>
  );
}

export function DeleteUnemploymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    setLoading(true);
    await fetch("/api/unemployment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
      {loading ? "…" : "Delete"}
    </button>
  );
}
