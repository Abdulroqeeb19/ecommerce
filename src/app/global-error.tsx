"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong</title>
      </head>
      <body className="bg-white text-slate-900">
        <NextError statusCode={500} title="Something went wrong" />
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-500">We&apos;ve been notified and are looking into it.</p>
          <button
            onClick={reset}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}