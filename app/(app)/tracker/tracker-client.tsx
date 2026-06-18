"use client";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import type { TimelineData } from "@/lib/opt-engine";
import { Calendar, Copy, Check, Plus, Pencil, Trash2 } from "lucide-react";

interface Job {
  id: string;
  employerName: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

interface OPTDates {
  id: string;
  optStartDate: string | null;
  optEndDate: string | null;
  stemStartDate: string | null;
  stemEndDate: string | null;
}

interface Props {
  opt: OPTDates;
  timeline: TimelineData;
  initialJobs: Job[];
}

export function TrackerClient({ opt, timeline, initialJobs }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [form, setForm] = useState({ employerName: "", startDate: "", endDate: "", isCurrent: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function addJob(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/employment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const job = await res.json();
    setJobs((j) => [...j, job].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
    setForm({ employerName: "", startDate: "", endDate: "", isCurrent: false });
    setLoading(false);
  }

  async function deleteJob(id: string) {
    await fetch("/api/employment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setJobs((j) => j.filter((job) => job.id !== id));
  }

  async function saveEdit(id: string) {
    const res = await fetch("/api/employment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    const updated = await res.json();
    setJobs((j) => j.map((job) => job.id === id ? updated : job));
    setEditingId(null);
  }

  function copyJobDays(job: Job) {
    const end = job.endDate ? new Date(job.endDate) : new Date();
    return differenceInDays(end, new Date(job.startDate)) + 1;
  }

  function copySummary() {
    const lines = [
      "OPT Unemployment Summary",
      "========================",
      `Total Used: ${timeline.unemploymentDaysUsed} days`,
      `Total Allowed: ${timeline.unemploymentDaysUsed + timeline.unemploymentDaysRemaining} days`,
      "",
      ...timeline.phases.map((p) =>
        `${p.label}: ${p.used} used / ${p.limit} allowed (${p.percentUsed}%)`
      ),
      "",
      "Employment History:",
      ...jobs.map((j) => {
        const end = j.isCurrent ? "Today" : (j.endDate ? format(new Date(j.endDate), "MMM d, yyyy") : "—");
        return `• ${j.employerName}: ${format(new Date(j.startDate), "MMM d, yyyy")} – ${end} (${copyJobDays(j)} days)`;
      }),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function addToCalendar() {
    const deadlines = [
      opt.optEndDate && { label: "OPT Expires", date: opt.optEndDate },
      opt.stemEndDate && { label: "STEM OPT Expires", date: opt.stemEndDate },
    ].filter(Boolean) as { label: string; date: string }[];

    const icsEvents = deadlines.map(({ label, date }) => {
      const d = new Date(date);
      const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      return [
        "BEGIN:VEVENT",
        `DTSTART:${fmt(d)}`,
        `DTEND:${fmt(new Date(d.getTime() + 3600000))}`,
        `SUMMARY:${label}`,
        `DESCRIPTION:OPT Timeline reminder`,
        "END:VEVENT",
      ].join("\r\n");
    });

    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OPT Timeline//EN", ...icsEvents, "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opt-deadlines.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAllowed = timeline.unemploymentDaysUsed + timeline.unemploymentDaysRemaining;
  const isOver = timeline.unemploymentDaysUsed > totalAllowed;

  // Calculate visible unemployment gaps from job history
  function calcGaps() {
    if (!opt.optStartDate || jobs.length === 0) return [];
    const now = new Date();
    const windowStart = new Date(opt.optStartDate);
    const windowEnd = opt.stemEndDate ? new Date(opt.stemEndDate) : opt.optEndDate ? new Date(opt.optEndDate) : now;
    const sorted = [...jobs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const gaps: { start: Date; end: Date; days: number }[] = [];
    let cursor = windowStart;

    for (const job of sorted) {
      const jobStart = new Date(job.startDate) < windowStart ? windowStart : new Date(job.startDate);
      const jobEnd = job.endDate ? new Date(job.endDate) : now;
      if (jobStart > cursor) {
        const gapEnd = jobStart < windowEnd ? jobStart : windowEnd;
        const days = differenceInDays(gapEnd, cursor);
        if (days > 0) gaps.push({ start: cursor, end: gapEnd, days });
      }
      if (jobEnd > cursor) cursor = jobEnd;
    }
    // trailing gap
    const effectiveEnd = windowEnd < now ? windowEnd : now;
    if (cursor < effectiveEnd) {
      const days = differenceInDays(effectiveEnd, cursor);
      if (days > 0) gaps.push({ start: cursor, end: effectiveEnd, days });
    }
    return gaps;
  }

  const gaps = calcGaps();

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Unemployment Tracker</h1>
          <p className="text-muted-foreground mt-1">Track employment history to calculate unemployment days</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addToCalendar} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors">
            <Calendar className="h-4 w-4" /> Add to Calendar
          </button>
          <button onClick={copySummary} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Summary"}
          </button>
        </div>
      </div>

      {/* Unemployment Summary */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${isOver ? "text-red-400" : "text-green-400"}`}>
            {isOver ? "⚠ You have exceeded the allowed unemployment days." : "✓ Your unemployment days are within the allowed limit."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{timeline.unemploymentDaysUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Used</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalAllowed}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Allowed</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Usage</p>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (timeline.unemploymentDaysUsed / totalAllowed) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round((timeline.unemploymentDaysUsed / totalAllowed) * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      {timeline.phases.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {timeline.phases.map((phase) => (
            <div key={phase.phase} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-medium">{phase.label}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold">{phase.used}</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{phase.remaining}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{phase.limit}</p>
                  <p className="text-xs text-muted-foreground">Limit</p>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${phase.percentUsed >= 80 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${phase.percentUsed}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{phase.percentUsed}% used</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Employment */}
      <form onSubmit={addJob} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-medium">Add Employment</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Employer Name</label>
            <input
              required
              placeholder="e.g., Acme Corporation"
              value={form.employerName}
              onChange={(e) => setForm((f) => ({ ...f, employerName: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              disabled={form.isCurrent}
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isCurrent}
            onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked, endDate: "" }))}
          />
          This is my current job (ongoing)
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Employment
        </button>
      </form>

      {/* Employment History List */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Employment History</h3>
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              {editingId === job.id ? (
                <div className="space-y-2">
                  <input
                    value={editForm.employerName ?? job.employerName}
                    onChange={(e) => setEditForm((f) => ({ ...f, employerName: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={editForm.startDate ?? job.startDate.slice(0, 10)}
                      onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="date"
                      disabled={editForm.isCurrent ?? job.isCurrent}
                      value={editForm.endDate ?? (job.endDate?.slice(0, 10) ?? "")}
                      onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isCurrent ?? job.isCurrent}
                      onChange={(e) => setEditForm((f) => ({ ...f, isCurrent: e.target.checked }))}
                    />
                    Current job
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(job.id)} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Save</button>
                    <button onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{job.employerName}</span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(job.startDate), "MMM d, yyyy")} – {job.isCurrent ? "Today" : (job.endDate ? format(new Date(job.endDate), "MMM d, yyyy") : "—")}
                      {" "}({copyJobDays(job)} days)
                    </span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => { setEditingId(job.id); setEditForm({}); }} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unemployment Gaps */}
      {gaps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Unemployment Gaps</h3>
          {gaps.map((gap, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm">
              <span className="text-yellow-400">
                {format(gap.start, "MMM d, yyyy")} → {format(gap.end, "MMM d, yyyy")}
              </span>
              <span className="font-medium text-yellow-400">{gap.days} days</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">⚠ This tool is for reference purposes only. Always consult your international student office for official guidance.</p>
    </div>
  );
}
