import type { Metadata } from "next";
import { ReferralCard } from "@components/ReferralCard";

export const metadata: Metadata = {
  title: "Invite a friend - Fort Worth TX DAO",
};

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gray-900">Invite a friend</h1>
        <p className="mt-2 text-gray-600">
          Help grow Fort Worth DAO and follow the points your invitations earn.
        </p>
      </header>
      <ReferralCard />
    </div>
  );
}
