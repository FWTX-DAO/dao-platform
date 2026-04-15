"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useDocument,
  useDocumentAuditTrail,
  useDocumentShares,
  useUpdateDocument,
  useDeleteDocument,
  useDownloadDocument,
  useShareDocument,
  useRevokeShare,
} from "@hooks/useDocuments";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: doc, isLoading } = useDocument(id);
  const { data: auditTrail = [] } = useDocumentAuditTrail(id);
  const { data: shares = [] } = useDocumentShares(id);
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();
  const updateMutation = useUpdateDocument();
  const shareMutation = useShareDocument();
  const revokeMutation = useRevokeShare();

  const [activeTab, setActiveTab] = useState<"details" | "audit" | "shares">(
    "details",
  );
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
  });
  const [shareUserId, setShareUserId] = useState("");

  if (isLoading)
    return <div className="py-8 text-center text-gray-500">Loading{"…"}</div>;
  if (!doc)
    return (
      <div className="py-8 text-center text-gray-500">Document not found</div>
    );

  const d = doc as any;

  const handleEdit = () => {
    setEditForm({
      name: d.name,
      description: d.description || "",
      category: d.category || "General",
      tags: d.tags || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { id, ...editForm },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this document?")) return;
    deleteMutation.mutate(id, { onSuccess: () => router.push("/documents") });
  };

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUserId.trim()) return;
    shareMutation.mutate(
      { documentId: id, sharedWithId: shareUserId },
      { onSuccess: () => setShareUserId("") },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">
              {d.category || "General"}
            </span>
            <span className="text-xs text-gray-400">{d.mimeType}</span>
            <span className="text-xs text-gray-400">
              {formatFileSize(d.fileSize)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{d.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            by {d.uploaderName || "Anonymous"} &middot;{" "}
            {new Date(d.createdAt).toLocaleDateString()}
            &middot; {d.accessCount || 0} views
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadMutation.mutate(id)}
            disabled={downloadMutation.isPending}
            className="px-3 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
          >
            Download
          </button>
          {(d.isUploader || d.isAdmin) && (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
          <div>
            <label
              htmlFor="doc-name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="doc-name"
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="doc-desc"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="doc-desc"
              value={editForm.description}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(["details", "audit", "shares"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "audit"
                ? "Audit Trail"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "audit" && ` (${auditTrail.length})`}
              {tab === "shares" && ` (${shares.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="space-y-4">
          {d.description && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {d.description}
              </p>
            </div>
          )}
          {d.tags && (
            <div className="flex flex-wrap gap-2">
              {d.tags.split(",").map((tag: string) => (
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
      )}

      {activeTab === "audit" && (
        <div className="space-y-3">
          {auditTrail.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No audit events.</p>
          ) : (
            auditTrail.map((entry: any) => (
              <div
                key={entry.id}
                className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-sm text-gray-900">
                    {entry.action}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    by {entry.userName || "System"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "shares" && (
        <div className="space-y-4">
          {(d.isUploader || d.isAdmin) && (
            <form onSubmit={handleShare} className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="share-user"
                  className="block text-sm font-medium text-gray-700"
                >
                  Share with User ID
                </label>
                <input
                  id="share-user"
                  type="text"
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  placeholder="User ID"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={shareMutation.isPending}
                className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
              >
                Share
              </button>
            </form>
          )}
          {shares.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No shares.</p>
          ) : (
            shares.map((share: any) => (
              <div
                key={share.id}
                className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-gray-900">
                    Shared by {share.sharedByName || "Unknown"}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {share.shareType} access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(share.createdAt).toLocaleDateString()}
                  </span>
                  {(d.isUploader || d.isAdmin) && (
                    <button
                      onClick={() => revokeMutation.mutate(share.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
