"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  UploadCloud,
  FolderOpen,
  Play,
  RefreshCw,
  Check,
  X,
  Search,
  Trash2,
  Loader2,
  ImageIcon,
  FileWarning,
  ArrowLeft,
  ListFilter
} from "lucide-react";
import { useToast } from "@/store/toast";
import { api } from "@/lib/api";
import { cx } from "@/lib/utils";
import type { ImageImportItem, ImageImportJob, Product, AiImageAnalysis } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const STATUS_LABELS: Record<ImageImportItem["status"], string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  matched: "Matched",
  review: "Review",
  unmatched: "Unmatched",
  failed: "Failed",
  rejected: "Rejected",
  duplicate: "Duplicate"
};

function StatusBadge({ status }: { status: ImageImportItem["status"] }) {
  const colors: Record<ImageImportItem["status"], string> = {
    uploaded: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    matched: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    review: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    unmatched: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    rejected: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    duplicate: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
  };
  return <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", colors[status])}>{STATUS_LABELS[status]}</span>;
}

const JOB_STATUS_LABELS: Record<ImageImportJob["status"], string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled"
};

function JobStatusBadge({ status }: { status: ImageImportJob["status"] }) {
  const colors: Record<ImageImportJob["status"], string> = {
    pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
  };
  return <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", colors[status])}>{JOB_STATUS_LABELS[status]}</span>;
}

function AnalysisBlock({ analysis }: { analysis?: AiImageAnalysis }) {
  if (!analysis) return <p className="text-xs text-slate-400">No AI analysis yet.</p>;
  const rows: [string, string][] = [
    ["Type", analysis.product_type || "—"],
    ["Brand", analysis.brand || "—"],
    ["Model", analysis.model || "—"],
    ["Color", analysis.color || "—"],
    ["Category", analysis.category || "—"],
    ["Variant", analysis.variant || "—"]
  ];
  return (
    <div className="space-y-1 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="w-16 shrink-0 font-semibold text-slate-500 dark:text-slate-400">{k}</span>
          <span className="text-slateink dark:text-slate-200">{v}</span>
        </div>
      ))}
      {analysis.visible_text.length > 0 && (
        <div className="flex gap-2">
          <span className="w-16 shrink-0 font-semibold text-slate-500 dark:text-slate-400">Text</span>
          <span className="text-slateink dark:text-slate-200">{analysis.visible_text.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

interface JobPayload {
  job: ImageImportJob;
  items: ImageImportItem[];
}

export function ImageImportPanel() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<ImageImportJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [active, setActive] = useState<JobPayload | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<"all" | ImageImportItem["status"]>("all");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [reassignItem, setReassignItem] = useState<ImageImportItem | null>(null);

  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      setJobs(await api.get<ImageImportJob[]>("/admin/image-import/jobs"));
    } catch (e) {
      toast((e as Error).message || "Could not load import jobs", "error");
    } finally {
      setLoadingJobs(false);
    }
  }, [toast]);

  const refreshActive = useCallback(async (jobId: string) => {
    try {
      const payload = await api.get<JobPayload>(`/admin/image-import/jobs/${jobId}`);
      setActive(payload);
      setActiveJobId(jobId);
    } catch (e) {
      toast((e as Error).message || "Could not load job", "error");
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async job list load on mount
    refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    if (activeJobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async job detail load on job change
      refreshActive(activeJobId);
    }
  }, [activeJobId, refreshActive]);

  const createJob = async () => {
    setCreating(true);
    try {
      const job = await api.post<ImageImportJob>("/admin/image-import/jobs", {});
      await refreshJobs();
      setActiveJobId(job.id);
      toast("Import job created — add images to start");
    } catch (e) {
      toast((e as Error).message || "Could not create job", "error");
    } finally {
      setCreating(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const jobId = activeJobId || active?.job.id;
    if (!jobId || !files.length) return;
    const valid = files.filter((f) => ACCEPTED.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (!valid.length) {
      toast("No supported images (JPG, PNG, WEBP)", "error");
      return;
    }
    setUploading(true);
    const total = valid.length;
    let done = 0;
    try {
      for (const file of valid) {
        const form = new FormData();
        form.append("files", file);
        const res = await fetch(`/api/admin/image-import/jobs/${jobId}/upload`, {
          method: "POST",
          body: form
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string; results?: { ok: boolean }[] };
        if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
        done += 1;
        setUploadProgress({ done, total });
      }
      toast(`Uploaded ${done} of ${total} image${total !== 1 ? "s" : ""}`);
      await refreshActive(jobId);
      await refreshJobs();
    } catch (e) {
      toast((e as Error).message || "Upload failed", "error");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(Array.from(e.target.files));
  };

  const startProcessing = async () => {
    const jobId = activeJobId || active?.job.id;
    if (!jobId || processing) return;
    setProcessing(true);
    try {
      const payload = await api.post<JobPayload>(`/admin/image-import/jobs/${jobId}/process`, {});
      setActive(payload);
      await refreshJobs();
      toast("AI matching complete — review suggestions below");
    } catch (e) {
      toast((e as Error).message || "Processing failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  const approve = async (item: ImageImportItem) => {
    try {
      await api.post(`/admin/image-import/items/${item.id}/approve`, {});
      toast("Image attached to product");
      if (activeJobId) refreshActive(activeJobId);
    } catch (e) {
      toast((e as Error).message || "Could not approve", "error");
    }
  };

  const reject = async (item: ImageImportItem) => {
    try {
      await api.post(`/admin/image-import/items/${item.id}/reject`, {});
      toast("Image rejected");
      if (activeJobId) refreshActive(activeJobId);
    } catch (e) {
      toast((e as Error).message || "Could not reject", "error");
    }
  };

  const searchProducts = async (query: string) => {
    setProductSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const all = await api.get<Product[]>("/products");
      const q = query.toLowerCase();
      const results = all.filter((p) => `${p.title} ${p.brand} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q)).slice(0, 12);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  };

  const reassignAndApprove = async (productId: string) => {
    if (!reassignItem) return;
    try {
      await api.post(`/admin/image-import/items/${reassignItem.id}/approve`, { productId });
      toast("Image attached to selected product");
      setReassignItem(null);
      if (activeJobId) refreshActive(activeJobId);
    } catch (e) {
      toast((e as Error).message || "Could not reassign", "error");
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this import job and its images?")) return;
    try {
      await api.del(`/admin/image-import/jobs/${id}`);
      if (activeJobId === id) setActiveJobId(null);
      setActive(null);
      await refreshJobs();
      toast("Job deleted");
    } catch (e) {
      toast((e as Error).message || "Could not delete job", "error");
    }
  };

  const retry = async () => {
    const jobId = activeJobId || active?.job.id;
    if (!jobId) return;
    try {
      const r = await api.post<{ reprocessed: number }>(`/admin/image-import/jobs/${jobId}/retry`, {});
      toast(`Reprocessed ${r.reprocessed} image${r.reprocessed !== 1 ? "s" : ""}`);
      await refreshActive(jobId);
    } catch (e) {
      toast((e as Error).message || "Retry failed", "error");
    }
  };

  const items = active?.items || [];
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const progress = active ? Math.round((active.job.processedImages / Math.max(1, active.job.totalImages)) * 100) : 0;

  if (activeJobId && active) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => { setActiveJobId(null); setActive(null); }} className="btn-outline text-xs">
            <ArrowLeft className="h-4 w-4" /> All jobs
          </button>
          <div className="flex items-center gap-2">
            <button onClick={retry} className="btn-outline text-xs"><RefreshCw className="h-4 w-4" /> Retry failed</button>
            <button onClick={() => deleteJob(active.job.id)} className="btn-outline text-xs !text-red-600 dark:!text-red-400">
              <Trash2 className="h-4 w-4" /> Delete job
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Import Job</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {active.job.id} · created {new Date(active.job.createdAt).toLocaleString()} · <JobStatusBadge status={active.job.status} />
              </p>
            </div>
            <button onClick={startProcessing} disabled={processing || active.job.status === "completed"} className="btn-primary text-xs">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {processing ? "Matching…" : "START AI MATCHING"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ["Total", active.job.totalImages],
              ["Processed", active.job.processedImages],
              ["Matched", active.job.matchedImages],
              ["Review", active.job.reviewImages],
              ["Unmatched", active.job.unmatchedImages],
              ["Failed", active.job.failedImages]
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-3 text-center">
                <p className="text-2xl font-extrabold text-slateink dark:text-white">{value as number}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">Progress {progress}%</p>

          <div className="mt-5">
            <label className="label">Add more images</label>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onFiles} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-xs">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />} {uploading ? "Uploading…" : "Select images"}
              </button>
              {uploadProgress && (
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" /> AI Review Queue
            </h3>
            <div className="flex gap-1 overflow-x-auto">
              {(["all", "review", "matched", "unmatched", "failed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cx(
                    "rounded-full px-3 py-1 text-xs font-bold capitalize",
                    filter === f ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-400 py-8">No images in this view yet. Upload images and start AI matching.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 dark:border-navy-700 p-4 grid md:grid-cols-[96px_1fr_auto] gap-4 items-start">
                  <div className="rounded-lg bg-slate-100 dark:bg-navy-800 overflow-hidden h-24 w-24 shrink-0">
                    {item.storagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/admin/image-import/proxy?path=${encodeURIComponent(item.storagePath)}`} alt={item.originalFilename} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-slate-400"><ImageIcon className="h-8 w-8" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-slateink dark:text-white truncate">{item.originalFilename}</p>
                      <StatusBadge status={item.status} />
                      {typeof item.confidenceScore === "number" && (
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{item.confidenceScore}%</span>
                      )}
                    </div>
                    <div className="mt-2 grid sm:grid-cols-2 gap-3">
                      <AnalysisBlock analysis={item.aiAnalysis} />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-500 dark:text-slate-400">Suggested product</p>
                        {item.candidateProductId ? (
                          <p className="text-slateink dark:text-slate-200 mt-0.5">{item.candidateProductId}</p>
                        ) : (
                          <p className="text-slate-400 mt-0.5">No candidate found</p>
                        )}
                        {item.errorMessage && <p className="text-red-600 dark:text-red-400 mt-1 break-words">{item.errorMessage}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    {item.status === "review" || item.status === "unmatched" || item.status === "matched" ? (
                      <>
                        <button onClick={() => approve(item)} className="btn-primary text-xs !px-3"><Check className="h-4 w-4" /> Accept</button>
                        <button onClick={() => setReassignItem(item)} className="btn-outline text-xs !px-3"><Search className="h-4 w-4" /> Change product</button>
                        <button onClick={() => reject(item)} className="btn-outline text-xs !px-3 !text-red-600 dark:!text-red-400"><X className="h-4 w-4" /> Reject</button>
                      </>
                    ) : null}
                    {item.status === "failed" && (
                      <span className="text-xs text-slate-400"><FileWarning className="h-4 w-4 inline" /> Use Retry</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {reassignItem && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
            <div className="card w-full max-w-lg p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slateink dark:text-white">Attach to a different product</h3>
                <button onClick={() => setReassignItem(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{reassignItem.originalFilename}</p>
              <input
                className="input mt-4"
                placeholder="Search products by title, brand, category…"
                value={productSearch}
                onChange={(e) => searchProducts(e.target.value)}
                autoFocus
              />
              <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => reassignAndApprove(p.id)}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-sm text-slateink dark:text-slate-200"
                  >
                    <span className="font-semibold">{p.title}</span>
                    <span className="block text-xs text-slate-400">{p.category} · {p.id}</span>
                  </button>
                ))}
                {productSearch.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-slate-400 px-3 py-2">No products match “{productSearch}”.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary-600" /> AI Product Image Importer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Upload product photos — AI Vision identifies each item and matches it to your catalog with a confidence score.
            </p>
          </div>
          <button onClick={createJob} disabled={creating} className="btn-primary text-xs">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} {creating ? "Creating…" : "New import job"}
          </button>
        </div>

        <div
          className={cx(
            "mt-5 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30" : "border-slate-300 dark:border-navy-700"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); uploadFiles(Array.from(e.dataTransfer.files)); }}
        >
          <UploadCloud className="h-10 w-10 mx-auto text-slate-400" />
          <p className="mt-3 font-semibold text-slateink dark:text-white">Drag &amp; drop product images</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPG · JPEG · PNG · WEBP · up to 10MB each · multi-file supported</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-primary-600" /> Import jobs
          </h3>
          {loadingJobs && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        {jobs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400 py-8">No import jobs yet. Click “New import job” to begin.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => refreshActive(job.id)}
                className="w-full text-left rounded-xl border border-slate-200 dark:border-navy-700 p-4 hover:border-primary-300 dark:hover:border-primary-500 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slateink dark:text-white">{job.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {job.matchedImages}/{job.totalImages} matched
                    </span>
                    <JobStatusBadge status={job.status} />
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                  <div
                    className={cx("h-full rounded-full", job.status === "completed" ? "bg-emerald-500" : "bg-primary-600")}
                    style={{ width: `${Math.min(100, Math.round((job.processedImages / Math.max(1, job.totalImages)) * 100))}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
