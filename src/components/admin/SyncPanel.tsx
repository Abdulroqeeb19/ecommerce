"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, CloudUpload, CloudDownload, AlertTriangle, CheckCircle2, X, RotateCcw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getSyncMeta, clearOpError } from "@/lib/db";
import { syncAll, pullCatalog } from "@/lib/sync";
import { useOnline } from "@/hooks/useOnline";
import { useToast } from "@/store/toast";
import { cx, formatDateTime } from "@/lib/utils";
import type { SyncResult } from "@/lib/api";

const OP_LABELS: Record<string, string> = {
  "create-product": "Create product",
  "update-product": "Update product",
  "create-order": "Place order",
  "update-stock": "Update stock",
  "update-order": "Update order status",
  "delete-product": "Delete product"
};

export function SyncPanel() {
  const online = useOnline();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const pending = useLiveQuery(() => db.syncQueue.filter((op) => !op.synced).toArray(), [], []);
  const refresh = useCallback(() => {
    getSyncMeta().then((v) => setLastSyncAt(v));
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh, tick]);

  const ordered = useMemo(() => [...(pending || [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [pending]);
  const failedCount = ordered.filter((o) => o.error).length;
  const conflictCount = ordered.filter((o) => o.conflicted).length;
  const cleanCount = ordered.length - failedCount;

  const doSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const r: SyncResult = await syncAll();
      setTick((t) => t + 1);
      if (r.pushed || r.pulled) {
        toast(`Synced ${r.pushed} change${r.pushed !== 1 ? "s" : ""} · pulled ${r.pulled} product${r.pulled !== 1 ? "s" : ""}`);
      }
      if (r.conflicts) toast(`${r.conflicts} conflict${r.conflicts !== 1 ? "s" : ""} need your review`, "error");
      else if (r.failed) toast(`${r.failed} change${r.failed !== 1 ? "s" : ""} failed to sync`, "error");
      else if (!r.pushed && !r.pulled) toast("Everything is up to date");
    } catch (e) {
      toast((e as Error).message || "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const pull = async () => {
    const n = await pullCatalog();
    setTick((t) => t + 1);
    toast(`Pulled ${n} products from the central backend`);
  };

  const retryOne = async (id: number | undefined) => {
    if (!id) return;
    await clearOpError(id);
    await doSync();
  };

  return (
    <div>
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cx("rounded-xl p-3", online ? "bg-emerald-50 dark:bg-emerald-900/40" : "bg-amber-50 dark:bg-amber-900/40")}>
              {online ? <CloudUpload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> : <CloudDownload className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slateink dark:text-white text-lg">
                {online ? "Connected to central backend" : "Offline mode"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {online
                  ? "Local changes sync automatically when you click Sync Now or reconnect."
                  : "Local changes are queued and will sync automatically when connectivity returns."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={pull} className="btn-outline text-xs">
              <CloudDownload className="h-4 w-4" /> Pull
            </button>
            <button onClick={doSync} disabled={syncing || !online} className="btn-primary text-xs disabled:opacity-60">
              <RefreshCw className={cx("h-4 w-4", syncing && "animate-spin")} /> {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Pending changes" value={String(ordered.length)} />
          <Stat label="Queued (no error)" value={String(cleanCount)} tone="emerald" />
          <Stat label="Failed" value={String(failedCount)} tone={failedCount ? "red" : "slate"} />
          <Stat label="Conflicts" value={String(conflictCount)} tone={conflictCount ? "amber" : "slate"} />
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Last sync: {lastSyncAt ? formatDateTime(lastSyncAt) : "never"}
        </p>
      </div>

      {ordered.length > 0 && (
        <div className="card p-6 mt-6">
          <h3 className="font-bold text-slateink dark:text-white text-lg mb-4">Sync Queue</h3>
          <div className="space-y-3">
            {ordered.map((op) => (
              <div key={op.id} className={cx("rounded-xl border p-4", op.error ? "border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-900/20" : op.conflicted ? "border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/20" : "border-slate-200 dark:border-slate-800")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {op.error ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                    ) : op.conflicted ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slateink dark:text-white truncate">
                        {OP_LABELS[op.op] || op.op}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDateTime(op.createdAt)}
                        {op.attempts ? ` · ${op.attempts} attempt${op.attempts > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  {op.error && (
                    <button onClick={() => retryOne(op.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0">
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </button>
                  )}
                </div>
                {op.error && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-white/60 dark:bg-slate-900/40 rounded-lg px-3 py-2">
                    {op.error}
                    {op.conflicted && (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        Pull from cloud, or edit this item again to push your latest version.
                      </span>
                    )}
                  </p>
                )}
                <button
                  onClick={() => {
                    db.syncQueue.delete(op.id!).then(() => setTick((t) => t + 1));
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" /> Discard this change
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "red" | "amber" }) {
  const tones: Record<string, string> = {
    slate: "text-slateink dark:text-white",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400"
  };
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
      <p className={cx("font-display text-2xl font-extrabold", tones[tone])}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
