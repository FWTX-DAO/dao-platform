import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments as getDocumentsAction,
  updateDocument as updateDocumentAction,
  deleteDocument as deleteDocumentAction,
} from "@/app/_actions/documents";
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

// Query Hooks
export const useDocuments = (params?: {
  category?: string;
  search?: string;
  user_id?: string;
}) => {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => getDocumentsAction({ search: params?.search, category: params?.category }),
    staleTime: 1000 * 60 * 3,
  });
};

export const useDocument = (id: string | null) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentsAction().then(docs => {
      const doc = (docs as any[]).find((d: any) => d.id === id);
      if (!doc) throw new Error('Document not found');
      return doc;
    }),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
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
          resolve(base64Parts[1]);
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

// File upload still uses fetch for large file handling (server actions have size limits)
const uploadFileToServer = async (file: File, metadata: any): Promise<any> => {
  const accessToken = await getAccessToken();
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
      return uploadFileToServer(file, metadata);
    },
    onMutate: async ({ file, metadata }) => {
      await queryClient.cancelQueries({ queryKey: ["documents"] });
      const previousDocuments = queryClient.getQueryData<DocumentWithUploader[]>(["documents"]);

      const optimisticDoc: DocumentWithUploader = {
        document: {
          id: `temp-${Date.now()}`,
          name: metadata.name,
          description: metadata.description,
          category: (metadata as any).category || 'General',
          mimeType: file.type,
          fileSize: file.size,
          pinataId: 'pending',
          cid: 'pending',
          network: 'ipfs',
          isPublic: (metadata as any).isPublic ? 1 : 0,
          tags: (metadata as any).tags || '',
          accessCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploaderId: 'temp',
          status: 'uploading',
        },
        uploader: {
          id: 'temp',
          username: 'You',
        },
      };

      queryClient.setQueryData<DocumentWithUploader[]>(["documents"], (old) =>
        old ? [optimisticDoc, ...old] : [optimisticDoc]
      );

      return { previousDocuments };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(["documents"], context.previousDocuments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentData: DocumentUpdate) =>
      updateDocumentAction(documentData.id, documentData),
    onMutate: async (updatedDoc) => {
      await queryClient.cancelQueries({ queryKey: ["documents"] });

      const previousDocuments = queryClient.getQueryData<DocumentWithUploader[]>(["documents"]);

      queryClient.setQueryData<DocumentWithUploader[]>(["documents"], (old) =>
        old ? old.map((doc): DocumentWithUploader =>
          doc.document.id === updatedDoc.id
            ? {
              ...doc,
              document: {
                ...doc.document,
                name: updatedDoc.name || doc.document.name,
                description: updatedDoc.description || doc.document.description,
                category: updatedDoc.category || doc.document.category,
                tags: updatedDoc.tags || doc.document.tags,
                isPublic: updatedDoc.isPublic !== undefined ? (updatedDoc.isPublic ? 1 : 0) : doc.document.isPublic,
                updatedAt: new Date().toISOString(),
              },
            }
            : doc
        ) : []
      );

      return { previousDocuments };
    },
    onError: (_err, _updatedDoc, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(["documents"], context.previousDocuments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocumentAction(documentId),
    onSuccess: (_, deletedDocumentId) => {
      queryClient.setQueryData(["documents"], (oldData: DocumentWithUploader[] | undefined) => {
        return oldData ? oldData.filter(doc => doc.document.id !== deletedDocumentId) : [];
      });
      queryClient.removeQueries({ queryKey: ["document", deletedDocumentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};
