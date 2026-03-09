import type { Metadata } from 'next';
import { OnboardingForm } from './_components/onboarding-form';

export const metadata: Metadata = {
  title: 'Join Fort Worth DAO',
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
