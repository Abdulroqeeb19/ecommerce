"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/store/toast";
import { DEFAULT_ORDERING_SCHEDULE } from "@/lib/utils";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const GRADES = ["JSS1", "JSS2", "JSS3"] as const;

export function OrderingScheduleEditor() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Record<string, number>>({ ...DEFAULT_ORDERING_SCHEDULE });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ schedule: Record<string, number> }>("/settings/order-schedule")
      .then((res) => {
        if (res && res.schedule && typeof res.schedule === "object") {
          setSchedule((prev) => ({ ...prev, ...res.schedule }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ schedule: Record<string, number> }>("/settings/order-schedule", { schedule });
      if (res && res.schedule && typeof res.schedule === "object") setSchedule(res.schedule);
      toast("Ordering days updated");
    } catch {
      toast("Could not save ordering days.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-600" /> Ordering Days per Grade
        </h3>
        <button onClick={save} disabled={saving || !loaded} className="btn-outline !py-2 text-xs">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Reassign each grade&apos;s ordering day at any time. The change applies immediately to the storefront.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {GRADES.map((grade) => (
          <div key={grade} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <label className="label">{grade}</label>
            <select
              value={schedule[grade] ?? DEFAULT_ORDERING_SCHEDULE[grade]}
              onChange={(e) =>
                setSchedule((prev) => ({ ...prev, [grade]: Number(e.target.value) }))
              }
              className="input w-full py-2 text-sm"
            >
              {WEEKDAYS.map((day, idx) => (
                <option key={day} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {!loaded && <p className="mt-3 text-xs text-slate-400">Loading current schedule...</p>}
    </div>
  );
}