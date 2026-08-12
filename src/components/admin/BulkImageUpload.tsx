"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { UploadCloud, FolderOpen, Loader2, CheckCircle2, XCircle, Sparkles, X, History } from "lucide-react";
import { useToast } from "@/store/toast";
import { cx } from "@/lib/utils";

interface BulkResult {
  filename: string;
  ok: boolean;
  source?: "filename" | "ai";
  status: "attached" | "review" | "unmatched" | "error";
  productId?: string;
  productTitle?: string;
  score?: number;
  error?: string;
}

interface BulkResponse {
  results: BulkResult[];
  matched: number;
  review: number;
  total: number;
  source: string;
}

interface BulkLogEntry {
  id: string;
  filename: string;
  uploadedAt: string;
  source: "filename" | "ai";
  status: "attached" | "review" | "unmatched" | "error";
  productId?: string;
  productTitle?: string;
  score?: number;
  error?: string;
  aiSummary?: string;
  matchedTokens?: string[];
}

export function BulkImageUpload() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [log, setLog] = useState<BulkLogEntry[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const loadLog = useCallback(() => {
    fetch("/api/admin/image-import/bulk")
      .then((res) => (res.ok ? (res.json() as Promise<{ log: BulkLogEntry[] }>) : Promise.resolve({ log: [] as BulkLogEntry[] })))
      .then((json) => setLog(json.log || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setResults(null);
    const form = new FormData();
    for (const f of files) form.append("files", f);
    try {
      const res = await fetch("/api/admin/image-import/bulk", { method: "POST", body: form });
      const json = (await res.json()) as BulkResponse;
      setResults(json.results);
      toast(`${json.matched} of ${json.total} images matched & saved (${json.review || 0} in review)`);
      loadLog();
    } catch (e) {
      toast((e as Error).message || "Bulk upload failed", "error");
      setResults([]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) upload(Array.from(e.target.files));
  };

  const matchedCount = results?.filter((r) => r.status === "attached").length || 0;
  const reviewCount = results?.filter((r) => r.status === "review").length || 0;
  const failedCount = results?.filter((r) => r.status !== "attached" && r.status !== "review").length || 0;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" /> Quick Bulk Importer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload many images at once. Matched by filename first (e.g.{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">logitech-m185-mouse.jpg</code> → Logitech M185);
            junk names like <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">IMG-2024….jpg</code> fall back to AI
            vision and are attached when confident, otherwise suggested for review. No storage bucket needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onFiles} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-xs">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />} {uploading ? "Matching…" : "Select images"}
          </button>
        </div>
      </div>

      <div
        className={cx(
          "mt-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30" : "border-slate-300 dark:border-navy-700"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(Array.from(e.dataTransfer.files)); }}
      >
        <UploadCloud className="h-8 w-8 mx-auto text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slateink dark:text-white">
          Drop any number of images here, or click “Select images”
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPG · PNG · WEBP · up to 10MB each</p>
      </div>

      {uploading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" /> Matching filenames & analyzing images…
        </div>
      )}

      {results && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slateink dark:text-white">
              <CheckCircle2 className="h-4 w-4 inline text-emerald-500" /> {matchedCount} matched
              {reviewCount > 0 && <span className="text-amber-500"> · {reviewCount} suggestions</span>}
              {failedCount > 0 && <span className="text-red-500"> · {failedCount} unmatched</span>}
            </p>
            <button onClick={() => setResults(null)} className="btn-outline text-xs"><X className="h-4 w-4" /> Clear</button>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.filename}
                className={cx(
                  "rounded-lg border p-3 text-xs",
                  r.status === "attached" && "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/20",
                  r.status === "review" && "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/20",
                  (r.status === "unmatched" || r.status === "error") && "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/20"
                )}
              >
                <p className="font-semibold text-slateink dark:text-white truncate">{r.filename}</p>
                {r.status === "attached" ? (
                  <>
                    <p className="mt-1 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {r.productTitle} ({r.score}%){r.source === "ai" ? " · AI" : " · name"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{r.productId}</p>
                  </>
                ) : (
                  <>
                    <p className={cx(
                      "mt-1 flex items-center gap-1",
                      r.status === "review" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {r.status === "review" ? <Sparkles className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {r.error}
                    </p>
                    {r.status === "review" && (
                      <p className="mt-1 text-[10px] text-slate-400 truncate">{r.filename} suggests: {r.productTitle}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 dark:border-navy-700 pt-3">
        <button
          onClick={() => setLogOpen((o) => !o)}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-primary-600"
        >
          <History className="h-3.5 w-3.5" /> Import log ({log.length})
          <span className={cx("transition-transform", logOpen && "rotate-180")}>▾</span>
        </button>
        {logOpen && (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-navy-700">
            {log.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 dark:text-slate-400">No imports yet. Upload images above to start logging.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-navy-800 text-left">
                  <tr>
                    <th className="p-2 font-semibold">When</th>
                    <th className="p-2 font-semibold">File</th>
                    <th className="p-2 font-semibold">Path</th>
                    <th className="p-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100 dark:border-navy-700 align-top">
                      <td className="p-2 whitespace-nowrap text-slate-400">{new Date(e.uploadedAt).toLocaleString()}</td>
                      <td className="p-2 max-w-[220px]">
                        <p className="truncate font-medium text-slateink dark:text-white">{e.filename}</p>
                        {e.aiSummary && <p className="text-[10px] text-slate-400 truncate" title={e.aiSummary}>👁 {e.aiSummary}</p>}
                      </td>
                      <td className="p-2">
                        <span className={cx(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          e.source === "ai" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300"
                        )}>
                          {e.source === "ai" ? "AI vision" : "filename"}
                        </span>
                      </td>
                      <td className="p-2">
                        {e.status === "attached" ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✓ {e.productTitle} ({e.score}%)
                          </span>
                        ) : e.status === "review" ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            ⚠ {e.productTitle} ({e.score}%)
                          </span>
                        ) : e.status === "error" ? (
                          <span className="text-red-500" title={e.error}>✗ {e.error?.slice(0, 40)}…</span>
                        ) : (
                          <span className="text-red-500">✗ unmatched</span>
                        )}
                        <span className="block text-[10px] text-slate-400 truncate">{e.productId || ""}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}