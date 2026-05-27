import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckInClient } from "./check-in-client";

export const metadata: Metadata = {
  title: "Community Roundtable Check-In | Fort Worth DAO",
  description:
    "Check in for the Fort Worth DAO Community Roundtable and earn attendance points.",
};

function CheckInFallback() {
  return (
    <main className="min-h-screen bg-dao-charcoal">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <div className="h-80 w-full animate-pulse rounded-lg border border-dao-border/60 bg-dao-dark/70" />
      </div>
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInFallback />}>
      <CheckInClient />
    </Suspense>
  );
}
