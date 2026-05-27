import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Join Fort Worth DAO",
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
