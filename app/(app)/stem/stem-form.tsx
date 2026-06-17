"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StemExtension } from "@prisma/client";

export function StemForm({ optId, existing }: { optId: string; existing: StemExtension | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    applicationDate: existing?.applicationDate ? existing.applicationDate.toString().slice(0, 10) : "",
    stemStartDate: existing?.stemStartDate ? existing.stemStartDate.toString().slice(0, 10) : "",
    stemEndDate: existing?.stemEndDate ? existing.stemEndDate.toString().slice(0, 10) : "",
    employerEverify: existing?.employerEverify ?? false,
  });
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/stem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optId, ...form }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h3 className="font-medium">{existing ? "Update" : "Add"} STEM Extension</h3>
      {(["applicationDate", "stemStartDate", "stemEndDate"] as const).map((key) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
          <input
            type="date"
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.employerEverify} onChange={(e) => setForm((f) => ({ ...f, employerEverify: e.target.checked }))} />
        Employer enrolled in E-Verify
      </label>
      <button type="submit" disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
