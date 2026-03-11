"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useBountyDetails,
  useAddBountyComment,
  useDeleteBountyComment,
  useSubmitProposal,
  getBountyStatusColor,
  formatBountyAmount,
} from "@hooks/useBounties";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";
import type { BountyComment, BountyProposal } from "@hooks/useBounties";

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: bounty, isLoading } = useBountyDetails(id);
  const { can } = useEntitlements();

  const [activeTab, setActiveTab] = useState<
    "details" | "proposals" | "comments"
  >("details");

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-500">
        Loading bounty{"…"}
      </div>
    );
  if (!bounty)
    return (
      <div className="py-8 text-center text-gray-500">Bounty not found</div>
    );

  const b = bounty as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {b.category && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {b.category}
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getBountyStatusColor(b.status)}`}
            >
              {b.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{b.title}</h1>
          {b.bountyAmount && (
            <p className="text-2xl font-bold text-green-600 mt-2 tabular-nums">
              {formatBountyAmount(b.bountyAmount)}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{b.proposalCount || 0} proposals</span>
            <span>{b.viewCount || 0} views</span>
            {b.organizationName && !b.isAnonymous && (
              <span>by {b.organizationName}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(b.isSubmitter || b.isAdmin) && (
            <Link
              href={`/bounties/${id}/edit`}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Admin screening info */}
      {b.isAdmin && b.screeningNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            Screening Notes
          </h3>
          <p className="text-sm text-yellow-700">{b.screeningNotes}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(["details", "proposals", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "proposals" && ` (${b.proposals?.length || 0})`}
              {tab === "comments" && ` (${b.comments?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && <DetailsTab bounty={b} />}
      {activeTab === "proposals" && (
        <ProposalsTab bounty={b} bountyId={id} canSubmit={can.submitBounty} />
      )}
      {activeTab === "comments" && (
        <CommentsTab
          bountyId={id}
          comments={b.comments || []}
          isAdmin={b.isAdmin}
        />
      )}
    </div>
  );
}

function DetailsTab({ bounty }: { bounty: any }) {
  return (
    <div className="space-y-6">
      <Section title="Problem Statement" content={bounty.problemStatement} />
      <Section title="Use Case" content={bounty.useCase} />
      <Section title="Desired Outcome" content={bounty.desiredOutcome} />
      <Section title="Current State" content={bounty.currentState} />
      <Section title="Common Tools Used" content={bounty.commonToolsUsed} />
      <Section title="Constraints" content={bounty.constraints} />
      <Section title="Deliverables" content={bounty.deliverables} />

      {bounty.technicalRequirements && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Requirements
          </h2>
          <p className="text-gray-700 whitespace-pre-line">
            {typeof bounty.technicalRequirements === "string"
              ? bounty.technicalRequirements
              : JSON.stringify(bounty.technicalRequirements, null, 2)}
          </p>
        </div>
      )}

      {/* Organization Info */}
      {(bounty.organizationName || bounty.organizationType) &&
        !bounty.isAnonymous && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Organization
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {bounty.organizationName && (
                <DL label="Name" value={bounty.organizationName} />
              )}
              {bounty.organizationType && (
                <DL label="Type" value={bounty.organizationType} />
              )}
              {bounty.organizationContact && (
                <DL label="Contact" value={bounty.organizationContact} />
              )}
              {bounty.organizationWebsite && (
                <DL label="Website" value={bounty.organizationWebsite} />
              )}
            </dl>
          </div>
        )}

      {/* Sponsor Info (admin or submitter only) */}
      {(bounty.isAdmin || bounty.isSubmitter) && bounty.sponsorFirstName && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sponsor Contact
          </h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DL
              label="Name"
              value={`${bounty.sponsorFirstName || ""} ${bounty.sponsorLastName || ""}`.trim()}
            />
            {bounty.sponsorEmail && (
              <DL label="Email" value={bounty.sponsorEmail} />
            )}
            {bounty.sponsorPhone && (
              <DL label="Phone" value={bounty.sponsorPhone} />
            )}
            {bounty.sponsorTitle && (
              <DL label="Title" value={bounty.sponsorTitle} />
            )}
          </dl>
        </div>
      )}

      {bounty.tags && (
        <div className="flex flex-wrap gap-2">
          {bounty.tags.split(",").map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalsTab({
  bounty,
  bountyId,
  canSubmit,
}: {
  bounty: any;
  bountyId: string;
  canSubmit: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const submitMutation = useSubmitProposal();
  const [form, setForm] = useState({
    proposalTitle: "",
    proposalDescription: "",
    approach: "",
    timeline: "",
    budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(
      { bountyId, ...form },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            proposalTitle: "",
            proposalDescription: "",
            approach: "",
            timeline: "",
            budget: "",
          });
        },
      },
    );
  };

  const proposals: BountyProposal[] = bounty.proposals || [];

  return (
    <div className="space-y-6">
      {bounty.status === "published" && !bounty.userHasProposal && (
        <UpgradeCTA allowed={canSubmit} feature="submit proposals">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-medium"
          >
            {showForm ? "Cancel" : "Submit Proposal"}
          </button>
        </UpgradeCTA>
      )}

      {bounty.userHasProposal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          You have already submitted a proposal for this bounty.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-sm rounded-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Submit Your Proposal
          </h3>
          <FormField
            id="proposal-title"
            label="Proposal Title *"
            value={form.proposalTitle}
            onChange={(v) => setForm((p) => ({ ...p, proposalTitle: v }))}
            required
          />
          <FormTextarea
            id="proposal-desc"
            label="Description *"
            value={form.proposalDescription}
            onChange={(v) => setForm((p) => ({ ...p, proposalDescription: v }))}
            required
            rows={4}
          />
          <FormTextarea
            id="proposal-approach"
            label="Approach *"
            value={form.approach}
            onChange={(v) => setForm((p) => ({ ...p, approach: v }))}
            required
            rows={3}
          />
          <FormField
            id="proposal-timeline"
            label="Timeline"
            value={form.timeline}
            onChange={(v) => setForm((p) => ({ ...p, timeline: v }))}
          />
          <FormField
            id="proposal-budget"
            label="Budget"
            value={form.budget}
            onChange={(v) => setForm((p) => ({ ...p, budget: v }))}
          />
          {submitMutation.isError && (
            <p className="text-sm text-red-600">
              {(submitMutation.error as any)?.message || "Failed to submit"}
            </p>
          )}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-medium"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {proposals.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No proposals yet.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {p.proposalTitle}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    by {p.proposerName || "Anonymous"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : p.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-gray-700 mt-3 text-sm whitespace-pre-line">
                {p.proposalDescription}
              </p>
              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <strong>Approach:</strong> {p.approach}
                </p>
                {p.timeline && (
                  <p className="mt-1">
                    <strong>Timeline:</strong> {p.timeline}
                  </p>
                )}
                {p.budget && (
                  <p className="mt-1">
                    <strong>Budget:</strong> {p.budget}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsTab({
  bountyId,
  comments,
  isAdmin,
}: {
  bountyId: string;
  comments: BountyComment[];
  isAdmin: boolean;
}) {
  const addMutation = useAddBountyComment();
  const deleteMutation = useDeleteBountyComment();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addMutation.mutate(
      { bountyId, content, parentId: replyTo || undefined, isInternal },
      {
        onSuccess: () => {
          setContent("");
          setReplyTo(null);
          setIsInternal(false);
        },
      },
    );
  };

  // Build threaded structure
  const rootComments = comments.filter((c) => !c.parentId);
  const childComments = comments.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm rounded-lg p-4 space-y-3"
      >
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Replying to comment</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-violet-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={addMutation.isPending || !content.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
            >
              {addMutation.isPending ? "Posting..." : "Post Comment"}
            </button>
            {isAdmin && (
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded-sm"
                />
                Internal only
              </label>
            )}
          </div>
        </div>
      </form>

      {rootComments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {rootComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={childComments.filter((r) => r.parentId === c.id)}
              onReply={setReplyTo}
              onDelete={(id) => deleteMutation.mutate(id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  isAdmin,
}: {
  comment: BountyComment;
  replies: BountyComment[];
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-medium text-sm text-gray-900">
            {comment.authorName || "User"}
          </span>
          {comment.isInternal && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm">
              Internal
            </span>
          )}
          <span className="ml-2 text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onReply(comment.id)}
            className="text-xs text-violet-600 hover:underline"
          >
            Reply
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
        {comment.content}
      </p>
      {replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">
                  {r.authorName || "User"}
                </span>
                {r.isInternal && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm">
                    Internal
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                {r.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper components
function Section({
  title,
  content,
}: {
  title: string;
  content?: string | null;
}) {
  if (!content) return null;
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-700 whitespace-pre-line">{content}</p>
    </div>
  );
}

function DL({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      />
    </div>
  );
}

function FormTextarea({
  id,
  label,
  value,
  onChange,
  required,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      />
    </div>
  );
}
