import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "../components/AppLayout";
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import {
  useDocuments,
  useDocument,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  type DocumentWithUploader,
  type DocumentUpdate
} from "../hooks/useDocuments";

const categories = ["General", "Legal", "Finance", "Technical", "Governance", "Meeting Notes"];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📺';
  return '📁';
};

export default function DocumentsPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentWithUploader | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentWithUploader | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "General",
    tags: "",
    isPublic: false,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "General", 
    tags: "",
    isPublic: false,
  });

  // Query parameters for filtering
  const queryParams = {
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchTerm.trim() || undefined,
  };

  // React Query hooks
  const { 
    data: documents = [], 
    isLoading, 
    error: documentsError 
  } = useDocuments(queryParams);
  
  const uploadMutation = useUploadDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  // Individual document query for viewing
  const { data: documentDetail } = useDocument(viewingDocument?.document.id || null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (documentsError) {
      setError("Failed to load documents");
    }
  }, [documentsError]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadForm({ ...uploadForm, name: file.name });
      setShowUpload(true);
    }
  }, [uploadForm]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadForm({ ...uploadForm, name: file.name });
      setShowUpload(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (!uploadForm.name.trim()) {
      setError("Please provide a name for the document");
      return;
    }

    try {
      setError("");
      await uploadMutation.mutateAsync({
        file: selectedFile,
        metadata: {
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          tags: uploadForm.tags,
          isPublic: uploadForm.isPublic,
        }
      });

      // Reset form
      setSelectedFile(null);
      setUploadForm({
        name: "",
        description: "",
        category: "General",
        tags: "",
        isPublic: false,
      });
      setShowUpload(false);
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    }
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument) return;

    try {
      setError("");
      const updateData: DocumentUpdate = {
        id: editingDocument.document.id,
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        tags: editForm.tags,
        isPublic: editForm.isPublic,
      };

      await updateMutation.mutateAsync(updateData);
      setEditingDocument(null);
    } catch (err: any) {
      setError(err.message || "Failed to update document");
    }
  };

  const handleDeleteDocument = async (doc: DocumentWithUploader) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(doc.document.id);
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  const startEditDocument = (doc: DocumentWithUploader) => {
    setEditingDocument(doc);
    setEditForm({
      name: doc.document.name,
      description: doc.document.description || "",
      category: doc.document.category,
      tags: doc.document.tags || "",
      isPublic: doc.document.isPublic === 1,
    });
  };

  const handleDownload = (doc: DocumentWithUploader) => {
    // First, set the viewing document to trigger the download URL fetch
    setViewingDocument(doc);
    // The actual download will be handled when documentDetail is available
    if (documentDetail?.downloadUrl) {
      window.open(documentDetail.downloadUrl, '_blank');
    } else {
      setError("Download link not available");
    }
  };

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Documents - Fort Worth TX DAO">
      <div 
        className="space-y-6"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
            <p className="mt-2 text-gray-600">Store and manage important documents securely</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === "All"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-violet-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Overlay */}
        {dragActive && (
          <div className="fixed inset-0 bg-violet-500 bg-opacity-20 border-4 border-dashed border-violet-400 z-50 flex items-center justify-center">
            <div className="text-center">
              <CloudArrowUpIcon className="h-16 w-16 text-violet-600 mx-auto mb-4" />
              <p className="text-2xl font-semibold text-violet-600">Drop your file here to upload</p>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Upload Document</h2>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedFile(null);
                    setUploadForm({ name: "", description: "", category: "General", tags: "", isPublic: false });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* File Input */}
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-violet-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Click to select a file or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-1">Max file size: 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getFileIcon(selectedFile.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Enter document name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="public-doc"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm({ ...uploadForm, isPublic: e.target.checked })}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label htmlFor="public-doc" className="ml-2 text-sm text-gray-700">
                    Make this document publicly accessible
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowUpload(false)}
                    disabled={uploadMutation.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending || !selectedFile || !uploadForm.name.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingDocument && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Document</h2>
                <button
                  onClick={() => setEditingDocument(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-public-doc"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-public-doc" className="ml-2 text-sm text-gray-700">
                    Make this document publicly accessible
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEditingDocument(null)}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDocument}
                    disabled={updateMutation.isPending || !editForm.name.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Document"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Loading documents...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FolderOpenIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No documents found</p>
            <p className="mb-4">Get started by uploading your first document</p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => (
              <div key={doc.document.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">
                      {getFileIcon(doc.document.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={doc.document.name}>
                        {doc.document.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.document.fileSize)}
                      </p>
                    </div>
                  </div>
                  {doc.document.isPublic === 1 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {doc.document.category}
                    </span>
                    {doc.document.tags && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <TagIcon className="h-3 w-3" />
                        <span className="text-xs truncate" title={doc.document.tags}>
                          {doc.document.tags}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {doc.document.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {doc.document.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p>Uploaded by {doc.uploader?.username || "Unknown"}</p>
                    <p>{new Date(doc.document.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded"
                    >
                      <EyeIcon className="h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <ArrowDownTrayIcon className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                  
                  {user && doc.document.uploaderId === user.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditDocument(doc)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded"
                      >
                        <PencilIcon className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}