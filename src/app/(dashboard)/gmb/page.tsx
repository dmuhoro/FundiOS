"use client";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GMBChecklistPage() {
  const checklist = useQuery(api.gmb.getChecklist);
  const updateChecklist = useMutation(api.gmb.updateChecklist);

  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [prevChecklist, setPrevChecklist] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (checklist && checklist.updatedAt !== prevChecklist) {
    setPrevChecklist(checklist.updatedAt);
    setCompleted(checklist.completedItems);
    setNotes(checklist.notes);
  }

  if (!checklist) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Google Business Profile checklist</h1>
          <p className="text-sm text-gray-600">Loading your launch checklist…</p>
        </div>
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  const total = checklist.items.length;
  const done = completed.length;
  const progress = done === 0 ? 0 : Math.round((done * 100) / total);

  async function toggle(key: string) {
    const next = completed.includes(key)
      ? completed.filter((k) => k !== key)
      : [...completed, key];
    setCompleted(next);
    setStatus(null);
    setError(null);
  }

  async function onSave() {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await updateChecklist({ completedItems: completed, notes });
      setStatus(`Saved — ${completed.length} of ${total} steps complete`);
    } catch (err) {
      const data = (err as { data?: { message?: string } }).data;
      setError(data?.message ?? (err instanceof Error ? err.message : "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Google Business Profile checklist</h1>
        <p className="text-sm text-gray-600">
          Launch your profile so discoverability, reviews and WhatsApp inquiries compound.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launch steps</CardTitle>
          <CardDescription>
            {done} of {total} complete · {progress}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <ul className="space-y-1">
            {checklist.items.map((item) => {
              const checked = completed.includes(item.key);
              return (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.key)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
                    />
                    <span className={checked ? "text-sm text-gray-400 line-through" : "text-sm text-gray-900"}>
                      {item.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & blockers</CardTitle>
          <CardDescription>Private per-garage notes (e.g. verification postcard pending).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setStatus(null);
            }}
            rows={3}
            placeholder="Anything blocking the launch?"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {status ? <p className="text-sm text-green-600">{status}</p> : null}
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save checklist"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}