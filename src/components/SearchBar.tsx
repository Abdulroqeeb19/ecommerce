"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { HoverSelect } from "@/components/HoverSelect";

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
      <HoverSelect
        value={category}
        onChange={setCategory}
        options={["All Categories", "Baby and Kids Essentials", "Electrical Materials and Fittings", "Home Essentials"].map((c) => ({ value: c, label: c }))}
        ariaLabel="Select category"
        className="hidden sm:block"
        triggerClassName="h-full bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg px-4 text-sm text-slate-600 dark:text-slate-300 min-w-44"
        listClassName="min-w-64"
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search baby and kids essentials, electrical materials, home essentials..."
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
