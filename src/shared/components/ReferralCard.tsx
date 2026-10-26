"use client";

import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { useReferrals } from "@hooks/useReferrals";

export function ReferralCard() {
  const { data, isPending, isError, refetch } = useReferrals();
  const [message, setMessage] = useState("");

  async function copyLink() {
    if (!data) return;
    const url = `${window.location.origin}/r/${data.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Invitation link copied.");
    } catch {
      setMessage(`Copy this invitation link: ${url}`);
    }
  }

  return (
    <section
      aria-labelledby="referral-title"
      className="rounded-lg border border-gray-100 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2
            id="referral-title"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            <UserPlus className="h-5 w-5 text-violet-600" aria-hidden="true" />{" "}
            Invite your community
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Earn 5 points when an invited member completes signup, plus 10 for
            each monthly membership payment or 120 for an annual payment.
            Renewals keep earning points.
          </p>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-4">
            <dl className="flex gap-5 text-sm">
              <div>
                <dt className="text-gray-500">Invited</dt>
                <dd className="text-xl font-semibold text-gray-900 tabular-nums">
                  {data.invitedMembers}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Paid members</dt>
                <dd className="text-xl font-semibold text-gray-900 tabular-nums">
                  {data.paidMembers}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Points earned</dt>
                <dd className="text-xl font-semibold text-violet-600 tabular-nums">
                  {data.earnedPoints}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy invite link
            </button>
          </div>
        )}
      </div>
      {isPending && (
        <p className="mt-3 text-sm text-gray-500" role="status">
          Loading your invitation…
        </p>
      )}
      {isError && (
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 min-h-11 text-sm text-violet-600 underline"
        >
          Could not load invitations. Try again.
        </button>
      )}
      {data && (
        <p className="mt-3 break-all text-xs text-gray-500">
          Your code: <span className="font-mono select-all">{data.code}</span>
        </p>
      )}
      <p role="status" className="mt-2 break-all text-sm text-violet-700">
        {message}
      </p>
      {!!data?.recentRewards.length && (
        <details className="mt-3 text-sm text-gray-600">
          <summary className="min-h-11 cursor-pointer content-center">
            Recent referral points
          </summary>
          <ul className="space-y-2 pb-2">
            {data.recentRewards.map((reward) => (
              <li
                key={reward.id}
                className="flex flex-wrap justify-between gap-2"
              >
                <span>
                  {reward.kind === "observer_signup"
                    ? "Member signup"
                    : "Membership payment"}{" "}
                  · {new Date(reward.createdAt).toLocaleDateString()}
                </span>
                <span className="font-medium text-violet-600">
                  +{reward.points} points
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
