"use client";

import Link from "next/link";
import {
  useMyBounties,
  getBountyStatusColor,
  formatBountyAmount,
} from "@hooks/useBounties";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";

export default function MyBountiesPage() {
  const { data: bounties = [], isLoading } = useMyBounties();
  const { can } = useEntitlements();

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-500">Loading{"\u2026"}</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Bounties</h1>
        <UpgradeCTA allowed={can.submitBounty} feature="submit bounties">
          <Link
            href="/bounties/submit"
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm"
          >
            Submit New
          </Link>
        </UpgradeCTA>
      </div>
      {bounties.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          You haven{"\u2019"}t submitted any bounties yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bounties.map((bounty: any) => (
            <Link
              key={bounty.id}
              href={`/bounties/${bounty.id}`}
              className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {bounty.category && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {bounty.category}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getBountyStatusColor(bounty.status)}`}
                    >
                      {bounty.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bounty.title}
                  </h3>
                  <p className="text-gray-600 mt-1 line-clamp-2">
                    {bounty.problemStatement}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {bounty.proposalCount || 0} proposals &middot;{" "}
                    {bounty.viewCount || 0} views
                  </p>
                </div>
                {bounty.bountyAmount && (
                  <p className="font-bold text-green-600 text-xl tabular-nums ml-4">
                    {formatBountyAmount(bounty.bountyAmount)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
