import { Suspense } from "react";
import { ShopContent } from "@/components/shop/ShopContent";

// Server-render this page per request so `useSearchParams` (category, search)
// is populated on a hard refresh instead of coming back empty from static
// prerendering — otherwise refreshing a category page would reset it to "All".
export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Loading shop…</div>}>
      <ShopContent />
    </Suspense>
  );
}