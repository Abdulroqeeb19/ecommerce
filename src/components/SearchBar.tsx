"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [category, setCategory] = useState("All Electronics");
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All Electronics") params.set("category", category);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="flex items-stretch w-full">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="hidden sm:block bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg px-4 text-sm text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
      >
        <option>All Electronics</option>
        <option>Laptops and Notebooks</option>
        <option>Smartphones and Accessories</option>
        <option>Printers and Scanners</option>
        <option>Office Ergonomics</option>
        <option>Audio and Headphones</option>
        <option>Monitors and Displays</option>
        <option>Networking and Storage</option>
        <option>Power and UPS</option>
      </select>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search laptops, printers, office gadgets..."
        className="flex-1 min-w-0 border border-slate-200 dark:border-slate-700 sm:border-l-0 px-4 py-3 text-sm outline-none focus:border-primary-500 bg-white dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        aria-label="Search"
        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-5 sm:px-7 rounded-r-lg flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">SEARCH</span>
      </button>
    </form>
  );
}
