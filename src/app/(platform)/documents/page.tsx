"use client";

import { useRef } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  useDocuments,
  useUploadDocument,
  useDownloadDocument,
} from "@hooks/useDocuments";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";

const DOCUMENT_CATEGORIES = [
  "all",
  "General",
  "Policy",
  "Financial",
  "Technical",
  "Legal",
  "Meeting",
  "Other",
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useDocuments({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
  });
  const { can } = useEntitlements();
  const uploadMutation = useUploadDocument();
  const downloadMutation = useDownloadDocument();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSettled: () => {
        // Reset the input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-gray-600">
            DAO documents and files stored on IPFS
          </p>
        </div>
        <UpgradeCTA allowed={can.uploadDocument} feature="upload documents">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm disabled:opacity-50"
          >
            {uploadMutation.isPending ? "Uploading…" : "Upload Document"}
          </button>
        </UpgradeCTA>
      </div>

      {uploadMutation.isError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Upload failed: {uploadMutation.error.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden w-64"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading{"…"}</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No documents found.
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc: any) => (
            <div
              key={doc.id}
              className="bg-white shadow-sm rounded-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex-1 hover:text-violet-600"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">
                      {doc.category || "General"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    by {doc.author_name || "Anonymous"} &middot;{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={() => downloadMutation.mutate(doc.id)}
                  disabled={downloadMutation.isPending}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs hover:bg-gray-50 ml-4"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
