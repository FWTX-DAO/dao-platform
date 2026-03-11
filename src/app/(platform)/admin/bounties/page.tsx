"use client";

import { useState } from "react";
import Link from "next/link";
import { useScreeningBounties, useScreenBounty } from "@hooks/useBounties";

export default function AdminBountiesPage() {
  const { data: bounties = [], isLoading } = useScreeningBounties();
  const screenMutation = useScreenBounty();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleScreen = (
    id: string,
    action: "approve" | "reject" | "request_changes",
  ) => {
    screenMutation.mutate({ id, action, notes: notes[id] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bounty Screening</h1>
        <p className="mt-1 text-gray-600">
          Review and approve submitted bounties
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading{"…"}</div>
      ) : bounties.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No bounties pending screening.
        </div>
      ) : (
        <div className="space-y-6">
          {bounties.map((bounty: any) => (
            <div
              key={bounty.id}
              className="bg-white shadow-sm rounded-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="hover:text-violet-600"
                    >
                      {bounty.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{bounty.category}</span>
                    <span>
                      {bounty.organizationType} &mdash;{" "}
                      {bounty.organizationName}
                    </span>
                    <span>by {bounty.submitterName || "Anonymous"}</span>
                    <span>
                      {new Date(bounty.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                  screening
                </span>
              </div>

              <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                {bounty.problemStatement}
              </p>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={`notes-${bounty.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Screening Notes
                  </label>
                  <textarea
                    id={`notes-${bounty.id}`}
                    value={notes[bounty.id] || ""}
                    onChange={(e) =>
                      setNotes((p) => ({ ...p, [bounty.id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Optional notes for the submitter..."
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleScreen(bounty.id, "approve")}
                    disabled={screenMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleScreen(bounty.id, "request_changes")}
                    disabled={screenMutation.isPending}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleScreen(bounty.id, "reject")}
                    disabled={screenMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
