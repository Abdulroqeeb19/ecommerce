import { Star } from "lucide-react";

export function RatingStars({ rating, reviews, size = 14 }: { rating: number; reviews?: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          let icon: "full" | "half" | "empty" = "empty";
          if (i < full) icon = "full";
          else if (i === full && half) icon = "half";
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={
                icon === "full"
                  ? "fill-amber-400 text-amber-400"
                  : icon === "half"
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-slate-300"
              }
            />
          );
        })}
      </div>
      <span className="text-xs font-medium text-slate-500">
        {rating.toFixed(1)}
        {typeof reviews === "number" && <span className="text-slate-400"> ({reviews})</span>}
      </span>
    </div>
  );
}
