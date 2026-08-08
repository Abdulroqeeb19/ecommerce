"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { PwaRegister } from "@/components/PwaRegister";

const HIDE_CHROME = new Set(["/tg"]);

export function ChromeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standalone = HIDE_CHROME.has(pathname);

  if (standalone) {
    return (
      <main className="flex-1">{children}</main>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CompareTray />
      <PwaRegister />
    </>
  );
}