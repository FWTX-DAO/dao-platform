"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useBountyDetails,
  useUpdateBounty,
  useDeleteBounty,
} from "@hooks/useBounties";
import { useState, useEffect } from "react";

export default function EditBountyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: bounty, isLoading } = useBountyDetails(id);
  const updateMutation = useUpdateBounty();
  const deleteMutation = useDeleteBounty();

  const [formData, setFormData] = useState({
    title: "",
    problemStatement: "",
    useCase: "",
    desiredOutcome: "",
    currentState: "",
    commonToolsUsed: "",
    constraints: "",
    deliverables: "",
    category: "",
    bountyAmount: "",
    organizationType: "",
    organizationName: "",
    organizationContact: "",
    organizationWebsite: "",
    tags: "",
    isAnonymous: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (bounty) {
      const b = bounty as any;
      setFormData({
        title: b.title || "",
        problemStatement: b.problemStatement || "",
        useCase: b.useCase || "",
        desiredOutcome: b.desiredOutcome || "",
        currentState: b.currentState || "",
        commonToolsUsed: b.commonToolsUsed || "",
        constraints: b.constraints || "",
        deliverables: b.deliverables || "",
        category: b.category || "",
        bountyAmount: b.bountyAmount ? String(b.bountyAmount) : "",
        organizationType: b.organizationType || "",
        organizationName: b.organizationName || "",
        organizationContact: b.organizationContact || "",
        organizationWebsite: b.organizationWebsite || "",
        tags: b.tags || "",
        isAnonymous: !!b.isAnonymous,
      });
    }
  }, [bounty]);

  if (isLoading)
    return <div className="py-8 text-center text-gray-500">Loading{"…"}</div>;
  if (!bounty)
    return (
      <div className="py-8 text-center text-gray-500">Bounty not found</div>
    );

  const b = bounty as any;
  if (!b.isSubmitter && !b.isAdmin) {
    return (
      <div className="py-8 text-center text-gray-500">
        Not authorized to edit this bounty.
      </div>
    );
  }

  const handleSave = () => {
    setError("");
    updateMutation.mutate(
      {
        id,
        ...formData,
        bountyAmount: formData.bountyAmount
          ? Number(formData.bountyAmount)
          : undefined,
      } as any,
      {
        onSuccess: (result: any) => {
          if (result && !result.success) {
            setError(result.error);
            return;
          }
          router.push(`/bounties/${id}`);
        },
      },
    );
  };

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this bounty? This action cannot be undone.",
      )
    )
      return;
    deleteMutation.mutate(id, {
      onSuccess: (result: any) => {
        if (result && !result.success) {
          setError(result.error);
          return;
        }
        router.push("/bounties");
      },
    });
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
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit Bounty</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <Field
          id="edit-title"
          label="Title"
          value={formData.title}
          onChange={set("title")}
        />
        <TextArea
          id="edit-problem"
          label="Problem Statement"
          value={formData.problemStatement}
          onChange={set("problemStatement")}
          rows={4}
        />
        <TextArea
          id="edit-usecase"
          label="Use Case"
          value={formData.useCase}
          onChange={set("useCase")}
          rows={3}
        />
        <TextArea
          id="edit-outcome"
          label="Desired Outcome"
          value={formData.desiredOutcome}
          onChange={set("desiredOutcome")}
          rows={3}
        />
        <TextArea
          id="edit-state"
          label="Current State"
          value={formData.currentState}
          onChange={set("currentState")}
          rows={2}
        />
        <Field
          id="edit-tools"
          label="Common Tools Used"
          value={formData.commonToolsUsed}
          onChange={set("commonToolsUsed")}
        />
        <TextArea
          id="edit-constraints"
          label="Constraints"
          value={formData.constraints}
          onChange={set("constraints")}
          rows={2}
        />
        <TextArea
          id="edit-deliverables"
          label="Deliverables"
          value={formData.deliverables}
          onChange={set("deliverables")}
          rows={3}
        />
        <Field
          id="edit-category"
          label="Category"
          value={formData.category}
          onChange={set("category")}
        />
        <Field
          id="edit-amount"
          label="Bounty Amount (cents)"
          type="number"
          value={formData.bountyAmount}
          onChange={set("bountyAmount")}
        />
        <Field
          id="edit-org-name"
          label="Organization Name"
          value={formData.organizationName}
          onChange={set("organizationName")}
        />
        <Field
          id="edit-org-type"
          label="Organization Type"
          value={formData.organizationType}
          onChange={set("organizationType")}
        />
        <Field
          id="edit-org-contact"
          label="Organization Contact"
          value={formData.organizationContact}
          onChange={set("organizationContact")}
        />
        <Field
          id="edit-org-website"
          label="Organization Website"
          value={formData.organizationWebsite}
          onChange={set("organizationWebsite")}
        />
        <Field
          id="edit-tags"
          label="Tags (comma separated)"
          value={formData.tags}
          onChange={set("tags")}
        />
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
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            Delete
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        autoComplete="off"
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      />
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        autoComplete="off"
        value={value}
        onChange={onChange}
        rows={rows}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      />
    </div>
  );
}
