"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { formatDate } from "@/lib/utils";
import { RatingStars } from "@/components/RatingStars";
import { cx } from "@/lib/utils";
import type { Review } from "@/lib/types";

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast("Please write a review before submitting", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title, comment });
      toast("Thanks! Your review has been published.");
      setTitle("");
      setComment("");
      setRating(5);
      onSubmitted();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-5">
      <h3 className="font-bold text-sm text-slateink dark:text-white">Write a review</h3>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cx(
                "h-6 w-6 transition-colors",
                (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{rating}/5</span>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="input mt-3"
        maxLength={120}
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
        className="input min-h-[90px] mt-3"
        maxLength={2000}
      />
      <button type="submit" disabled={submitting} className="btn-primary mt-3 disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { user, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  const load = useCallback(async () => {
    try {
      setReviews(await api.get<Review[]>(`/products/${productId}/reviews`));
    } catch {
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load on mount
    load();
  }, [load]);

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="font-display text-4xl font-extrabold text-slateink dark:text-white">{average ? average.toFixed(1) : "—"}</p>
          <RatingStars rating={average} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Based on <span className="font-bold text-slateink dark:text-white">{reviews.length}</span> review{reviews.length !== 1 && "s"}
        </p>
      </div>

      {user ? (
        <ReviewForm productId={productId} onSubmitted={load} />
      ) : (
        !loading && (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <LogIn className="h-4 w-4 shrink-0" />
            <span>
              <Link href="/account" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link> to write a review.
            </span>
          </div>
        )
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first to review this product!</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                  {(r.author.charAt(0) || "?").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slateink dark:text-white">{r.author}</p>
                  <RatingStars rating={r.rating} size={12} />
                </div>
              </div>
              <div className="text-right">
                {r.verified && <span className="text-xs text-emerald-600 font-semibold">Verified purchase</span>}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(r.createdAt)}</p>
              </div>
            </div>
            {r.title && <p className="mt-3 text-sm font-bold text-slateink dark:text-white">{r.title}</p>}
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}
