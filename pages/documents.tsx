import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "@components/AppLayout";
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";
import {
  useDocuments,
  useDocument,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  type DocumentWithUploader,
  type DocumentUpdate
} from "@hooks/useDocuments";

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

type SortField = 'name' | 'createdAt' | 'fileSize' | 'category';
type SortDirection = 'asc' | 'desc';

export default function DocumentsPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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

  // Sort documents
  const sortedDocuments = [...documents].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortField) {
      case 'name':
        aVal = a.document.name.toLowerCase();
        bVal = b.document.name.toLowerCase();
        break;
      case 'createdAt':
        aVal = new Date(a.document.createdAt).getTime();
        bVal = new Date(b.document.createdAt).getTime();
        break;
      case 'fileSize':
        aVal = a.document.fileSize;
        bVal = b.document.fileSize;
        break;
      case 'category':
        aVal = a.document.category.toLowerCase();
        bVal = b.document.category.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate documents
  const totalPages = Math.ceil(sortedDocuments.length / pageSize);
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
    setViewingDocument(doc);
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

        {/* Data Table */}
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Document
                        <ArrowsUpDownIcon className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Category
                        <ArrowsUpDownIcon className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('fileSize')}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Size
                        <ArrowsUpDownIcon className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Date
                        <ArrowsUpDownIcon className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDocuments.map(doc => (
                    <tr key={doc.document.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl flex-shrink-0">
                            {getFileIcon(doc.document.mimeType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate" title={doc.document.name}>
                                {doc.document.name}
                              </p>
                              {doc.document.isPublic === 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Public
                                </span>
                              )}
                            </div>
                            {doc.document.description && (
                              <p className="text-sm text-gray-500 truncate" title={doc.document.description}>
                                {doc.document.description}
                              </p>
                            )}
                            {doc.document.tags && (
                              <div className="flex items-center gap-1 mt-1">
                                <TagIcon className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {doc.document.tags}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {doc.document.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.document.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.uploader?.username || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.document.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          {user && doc.document.uploaderId === user.id && (
                            <>
                              <button
                                onClick={() => startEditDocument(doc)}
                                className="text-violet-600 hover:text-violet-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, sortedDocuments.length)}
                    </span>{' '}
                    of <span className="font-medium">{sortedDocuments.length}</span> results
                  </p>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md text-sm py-1 px-2"
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-violet-50 border-violet-500 text-violet-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
