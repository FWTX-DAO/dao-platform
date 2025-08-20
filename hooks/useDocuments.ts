import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

export interface Document {
  id: string;
  name: string;
  description?: string;
  category: string;
  mimeType: string;
  fileSize: number;
  pinataId: string;
  cid: string;
  network: string;
  isPublic: number;
  tags?: string;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
  uploaderId: string;
  status: string;
}

export interface DocumentWithUploader {
  document: Document;
  uploader: {
    id: string;
    username: string;
    avatarUrl?: string;
  } | null;
  downloadUrl?: string;
}

export interface DocumentInput {
  pinataId: string;
  cid: string;
  name: string;
  description?: string;
  category?: string;
  mimeType: string;
  fileSize: number;
  isPublic?: boolean;
  tags?: string;
}

export interface DocumentUpdate {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  isPublic?: boolean;
}

export interface UploadResult {
  id: string;
  cid: string;
  name: string;
  size: number;
  mimeType: string;
}

const fetchDocuments = async (params?: {
  category?: string;
  search?: string;
  user_id?: string;
}): Promise<DocumentWithUploader[]> => {
  const accessToken = await getAccessToken();
  const searchParams = new URLSearchParams();
  
  if (params?.category) searchParams.append("category", params.category);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.user_id) searchParams.append("user_id", params.user_id);
  
  const url = `/api/documents${searchParams.toString() ? `?${searchParams}` : ""}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }

  return response.json();
};

const fetchDocument = async (id: string): Promise<DocumentWithUploader> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/documents/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  return response.json();
};







const updateDocument = async (documentData: DocumentUpdate): Promise<DocumentWithUploader> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/documents/${documentData.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update document: ${response.statusText}`);
  }

  return response.json();
};

const deleteDocument = async (documentId: string): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
};

// Query Hooks
export const useDocuments = (params?: {
  category?: string;
  search?: string;
  user_id?: string;
}) => {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => fetchDocuments(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDocument = (id: string | null) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64Parts = result.split(',');
        if (base64Parts.length > 1 && base64Parts[1]) {
          resolve(base64Parts[1]); // Remove data:type;base64, prefix
        } else {
          reject(new Error('Invalid data URL format'));
        }
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const uploadFileToServer = async (file: File, metadata: any): Promise<any> => {
  const accessToken = await getAccessToken();
  
  // Convert file to base64
  const fileBase64 = await convertFileToBase64(file);
  
  const response = await fetch("/api/documents/server-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fileBase64,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      name: metadata.name,
      description: metadata.description || '',
      category: metadata.category || 'General',
      tags: metadata.tags || '',
      isPublic: metadata.isPublic || false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to upload file: ${response.statusText}`);
  }

  return response.json();
};

// Mutation Hooks
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, metadata }: { 
      file: File; 
      metadata: Omit<DocumentInput, 'pinataId' | 'cid' | 'mimeType' | 'fileSize'> 
    }) => {
      // Upload file to server, which handles Pinata upload and database creation
      const result = await uploadFileToServer(file, metadata);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (updatedDocument, variables) => {
      // Update the document in the list
      queryClient.setQueryData(["documents"], (oldData: DocumentWithUploader[] | undefined) => {
        return oldData ? oldData.map(doc => 
          doc.document.id === variables.id ? updatedDocument : doc
        ) : [updatedDocument];
      });
      
      // Update the individual document query
      queryClient.setQueryData(["document", variables.id], updatedDocument);
      
      // Invalidate all document queries to be safe
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, deletedDocumentId) => {
      // Remove the document from all lists
      queryClient.setQueryData(["documents"], (oldData: DocumentWithUploader[] | undefined) => {
        return oldData ? oldData.filter(doc => doc.document.id !== deletedDocumentId) : [];
      });
      
      // Remove the individual document query
      queryClient.removeQueries({ queryKey: ["document", deletedDocumentId] });
      
      // Invalidate all document queries to be safe
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};