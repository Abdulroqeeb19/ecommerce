"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [category, setCategory] = useState("All Categories");
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All Categories") params.set("category", category);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="flex items-stretch w-full">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="hidden sm:block bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg px-4 text-sm text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
      >
        <option>All Categories</option>
        <option>Babies Wears</option>
        <option>Electrical Materials and Fittings</option>
        <option>Kitchen Utensils</option>
      </select>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search babies wears, electrical materials, kitchen utensils..."
        className="flex-1 min-w-0 border border-slate-200 dark:border-navy-700 sm:border-l-0 px-4 py-3 text-sm outline-none focus:border-primary-500 bg-white dark:bg-navy-800 dark:text-slate-100"
      />
      <button
        type="submit"
        aria-label="Search"
        className="bg-primary-500 hover:bg-primary-400 text-slateink font-semibold text-sm px-5 sm:px-7 rounded-r-lg flex items-center gap-2 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">SEARCH</span>
      </button>
    </form>
  );
}
