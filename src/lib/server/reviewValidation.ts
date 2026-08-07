export function validateReviewInput(body: unknown): { value: { rating: number; title?: string; comment: string } | null; error?: string } {
  if (!body || typeof body !== "object") return { value: null, error: "Invalid review payload" };
  const b = body as Record<string, unknown>;

  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { value: null, error: "Rating must be an integer between 1 and 5" };
  }

  const comment = typeof b.comment === "string" ? b.comment.trim() : "";
  if (!comment) return { value: null, error: "Review comment is required" };
  if (comment.length > 2000) return { value: null, error: "Review comment must be 2000 characters or fewer" };

  const rawTitle = typeof b.title === "string" ? b.title.trim() : "";
  const title = rawTitle ? rawTitle.slice(0, 120) : undefined;

  return { value: { rating, comment, title } };
}
