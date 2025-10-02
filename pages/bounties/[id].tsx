import { useRouter } from "next/router";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "@components/AppLayout";
import { useBountyDetails, formatBountyAmount, getBountyStatusColor } from "@hooks/useBounties";
import {
  BuildingOfficeIcon,
  UserCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function BountyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, authenticated } = usePrivy();
  
  const { data: bounty, isLoading, error } = useBountyDetails(id as string);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  if (isLoading) {
    return (
      <AppLayout title="Loading... - Fort Worth TX DAO">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading bounty details...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !bounty) {
    return (
      <AppLayout title="Bounty Not Found - Fort Worth TX DAO">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bounty Not Found</h2>
          <p className="text-gray-600 mb-4">The bounty you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/bounties")}
            className="text-violet-600 hover:text-violet-700"
          >
            ← Back to Bounties
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${bounty.title} - Fort Worth TX DAO`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/bounties")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Bounties
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{bounty.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className={`px-3 py-1 rounded-full ${getBountyStatusColor(bounty.status)}`}>
                  {bounty.status}
                </span>
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {bounty.viewCount} views
                </span>
                <span className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  {bounty.proposalCount} proposals
                </span>
              </div>
            </div>
            
            {bounty.userIsSubmitter && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/bounties/${id}/edit`)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  Edit Bounty
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Statement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-violet-600" />
                Problem & Business Case
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Problem Statement</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{bounty.problemStatement}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Use Case</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{bounty.useCase}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Desired Outcome</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{bounty.desiredOutcome}</p>
                </div>
                
                {bounty.currentState && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Current State</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{bounty.currentState}</p>
                  </div>
                )}
                
                {bounty.commonToolsUsed && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Tools Currently Used</h3>
                    <p className="text-gray-600">{bounty.commonToolsUsed}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            {(bounty.technicalRequirements || bounty.constraints || bounty.deliverables) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-violet-600" />
                  Technical Details
                </h2>
                
                <div className="space-y-4">
                  {bounty.technicalRequirements && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Technical Requirements</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{bounty.technicalRequirements}</p>
                    </div>
                  )}
                  
                  {bounty.constraints && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Constraints</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{bounty.constraints}</p>
                    </div>
                  )}
                  
                  {bounty.deliverables && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Expected Deliverables</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{bounty.deliverables}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Discussion</h2>
              {bounty.comments && bounty.comments.length > 0 ? (
                <div className="space-y-4">
                  {bounty.comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No comments yet. Be the first to ask a question!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-violet-600" />
                Organization
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{bounty.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{bounty.organizationType.replace("-", " ")}</p>
                </div>
                {bounty.organizationWebsite && (
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={bounty.organizationWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:text-violet-700"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bounty Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-violet-600" />
                Bounty Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatBountyAmount(bounty.bountyAmount)}
                  </p>
                </div>
                {bounty.bountyType && (
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">{bounty.bountyType.replace("-", " ")}</p>
                  </div>
                )}
                {bounty.deadline && (
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-medium flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {bounty.category && (
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium capitalize">
                      {bounty.category.split("-").join(" ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info (if not anonymous and published) */}
            {bounty.status === "published" && !bounty.isAnonymous && bounty.organizationContact && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2 text-violet-600" />
                  Contact
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Interested in this bounty? Reach out to the sponsor to discuss your proposal.
                </p>
                <button
                  className="w-full px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                  onClick={() => {
                    // In a real app, this would show contact info or open a modal
                    alert("Contact information will be displayed after proposal submission");
                  }}
                >
                  Submit Proposal
                </button>
              </div>
            )}

            {/* Tags */}
            {bounty.tags && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {bounty.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}