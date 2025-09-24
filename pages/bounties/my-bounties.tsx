import { useRouter } from "next/router";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "../../components/AppLayout";
import { useBounties, formatBountyAmount, getBountyStatusColor } from "../../hooks/useBounties";
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function MyBountiesPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  
  // Fetch all bounties and filter client-side for now
  // In production, you'd add a server-side filter for user's bounties
  const { data: allBounties, isLoading, error, refetch } = useBounties({
    includeAll: true,
  });

  const myBounties = allBounties?.filter(bounty => 
    // Check if current user is the submitter (comparing with user ID would be better)
    bounty.submitterName === user?.email?.address || 
    bounty.submitterId === user?.id
  ) || [];

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="My Bounties - Fort Worth TX DAO">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/bounties")}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to All Bounties
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Bounties</h1>
            <p className="mt-2 text-gray-600">
              Manage your innovation challenges
            </p>
          </div>
          <button
            onClick={() => router.push("/bounties/submit")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Submit New Bounty
          </button>
        </div>

        {/* Bounties List */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading your bounties...</div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600 mb-4">Failed to load bounties.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        ) : myBounties.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No bounties yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Submit your first innovation challenge to get started.
            </p>
            <button
              onClick={() => router.push("/bounties/submit")}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Submit Your First Bounty
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bounty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myBounties.map((bounty) => (
                  <tr key={bounty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bounty.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bounty.organizationName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBountyStatusColor(bounty.status)}`}>
                        {bounty.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatBountyAmount(bounty.bountyAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {bounty.viewCount}
                        </span>
                        <span className="flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          {bounty.proposalCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bounty.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => router.push(`/bounties/${bounty.id}`)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/bounties/${bounty.id}/edit`)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}