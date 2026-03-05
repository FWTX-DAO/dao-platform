"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateBounty } from "@hooks/useBounties";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";
import { BOUNTY_CATEGORIES, BOUNTY_ORG_TYPES } from "@shared/constants";

export default function SubmitBountyPage() {
  const router = useRouter();
  const createMutation = useCreateBounty();
  const { can } = useEntitlements();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    problemStatement: "",
    useCase: "",
    desiredOutcome: "",
    currentState: "",
    commonToolsUsed: "",
    constraints: "",
    deliverables: "",
    category: "general",
    bountyAmount: "",
    bountyType: "fixed",
    organizationType: "civic",
    organizationName: "",
    organizationContact: "",
    organizationWebsite: "",
    sponsorFirstName: "",
    sponsorLastName: "",
    sponsorEmail: "",
    sponsorTitle: "",
    tags: "",
    isAnonymous: false,
  });

  if (!can.submitBounty) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Submit a Bounty</h1>
        <UpgradeCTA allowed={false} feature="submit bounties" mode="banner">
          <span />
        </UpgradeCTA>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(
      {
        ...formData,
        bountyAmount: formData.bountyAmount
          ? Number(formData.bountyAmount) * 100
          : undefined,
      } as any,
      {
        onSuccess: (result: any) => {
          if (result && !result.success) {
            setError(result.error);
            return;
          }
          router.push(
            result?.data?.id ? `/bounties/${result.data.id}` : "/bounties",
          );
        },
      },
    );
  };

  const set =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setFormData((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Submit a Bounty</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Bounty Details
          </h2>
          <div>
            <label
              htmlFor="submit-title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              id="submit-title"
              type="text"
              required
              value={formData.title}
              onChange={set("title")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-problem"
              className="block text-sm font-medium text-gray-700"
            >
              Problem Statement *
            </label>
            <textarea
              id="submit-problem"
              required
              value={formData.problemStatement}
              onChange={set("problemStatement")}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-usecase"
              className="block text-sm font-medium text-gray-700"
            >
              Use Case *
            </label>
            <textarea
              id="submit-usecase"
              required
              value={formData.useCase}
              onChange={set("useCase")}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-outcome"
              className="block text-sm font-medium text-gray-700"
            >
              Desired Outcome *
            </label>
            <textarea
              id="submit-outcome"
              required
              value={formData.desiredOutcome}
              onChange={set("desiredOutcome")}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-state"
              className="block text-sm font-medium text-gray-700"
            >
              Current State
            </label>
            <textarea
              id="submit-state"
              value={formData.currentState}
              onChange={set("currentState")}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-deliverables"
              className="block text-sm font-medium text-gray-700"
            >
              Deliverables
            </label>
            <textarea
              id="submit-deliverables"
              value={formData.deliverables}
              onChange={set("deliverables")}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="submit-category"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id="submit-category"
                value={formData.category}
                onChange={set("category")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              >
                {BOUNTY_CATEGORIES.filter((c) => c !== "all").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="submit-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Bounty Amount ($)
              </label>
              <input
                id="submit-amount"
                type="number"
                min="0"
                value={formData.bountyAmount}
                onChange={set("bountyAmount")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="submit-tags"
              className="block text-sm font-medium text-gray-700"
            >
              Tags (comma separated)
            </label>
            <input
              id="submit-tags"
              type="text"
              value={formData.tags}
              onChange={set("tags")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
        </section>

        {/* Organization Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Organization</h2>
          <div>
            <label
              htmlFor="submit-org-name"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Name *
            </label>
            <input
              id="submit-org-name"
              type="text"
              required
              value={formData.organizationName}
              onChange={set("organizationName")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="submit-org-type"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Type
            </label>
            <select
              id="submit-org-type"
              value={formData.organizationType}
              onChange={set("organizationType")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            >
              {BOUNTY_ORG_TYPES.filter((t) => t !== "all").map((t) => (
                <option key={t} value={t}>
                  {t
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Sponsor Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Sponsor Contact (Optional)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="submit-sponsor-first"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="submit-sponsor-first"
                type="text"
                value={formData.sponsorFirstName}
                onChange={set("sponsorFirstName")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              />
            </div>
            <div>
              <label
                htmlFor="submit-sponsor-last"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                id="submit-sponsor-last"
                type="text"
                value={formData.sponsorLastName}
                onChange={set("sponsorLastName")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="submit-sponsor-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="submit-sponsor-email"
              type="email"
              value={formData.sponsorEmail}
              onChange={set("sponsorEmail")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isAnonymous: e.target.checked }))
              }
              className="rounded-sm"
            />
            Submit anonymously
          </label>
        </section>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
        >
          {createMutation.isPending ? "Submitting\u2026" : "Submit Bounty"}
        </button>
      </form>
    </div>
  );
}
