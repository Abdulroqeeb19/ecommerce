"use client";

import { useEffect, useState } from "react";
import { countdownTo } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ target }: { target: Date }) {
  const [mounted, setMounted] = useState(false);
  const [cd, setCd] = useState(() => countdownTo(target));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) {
    const labels = ["Days", "Hours", "Mins", "Secs"];
    return (
      <div className="flex items-center gap-3">
        {labels.map((label) => (
          <div key={label} className="rounded-lg bg-slateink/70 border border-white/10 px-3 py-1.5 text-center min-w-[3.4rem]">
            <p className="font-display font-extrabold text-lg text-white tabular-nums leading-none">00</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (cd.days <= 0 && cd.hours <= 0 && cd.mins <= 0 && cd.secs <= 0) {
    return <span className="text-emerald-300 font-bold">Ordering is open now!</span>;
  }

  const cells = [
    { label: "Days", value: cd.days },
    { label: "Hours", value: pad(cd.hours) },
    { label: "Mins", value: pad(cd.mins) },
    { label: "Secs", value: pad(cd.secs) }
  ];

  return (
    <div className="flex items-center gap-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg bg-slateink/70 border border-white/10 px-3 py-1.5 text-center min-w-[3.4rem]">
          <p className="font-display font-extrabold text-lg text-white tabular-nums leading-none">{c.value}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
