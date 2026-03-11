import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments as getDocumentsAction,
  getDocumentById as getDocumentByIdAction,
  getDocumentAuditTrail as getDocumentAuditTrailAction,
  getDocumentShares as getDocumentSharesAction,
  updateDocument as updateDocumentAction,
  deleteDocument as deleteDocumentAction,
  shareDocument as shareDocumentAction,
  revokeShare as revokeShareAction,
  getDownloadUrl as getDownloadUrlAction,
} from "@/app/_actions/documents";
import { getAccessToken } from "@privy-io/react-auth";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface DocumentListItem {
  id: string;
  name: string;
  description?: string | null;
  category: string | null;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  accessCount: number;
  author_name: string | null;
  uploaderId: string;
  createdAt: string;
}

export interface DocumentDetail extends DocumentListItem {
  pinataId: string;
  cid: string;
  tags?: string | null;
  lastAccessedAt?: string | null;
  uploaderName: string | null;
  status: string;
  updatedAt: string;
  isUploader: boolean;
  isAdmin: boolean;
}

export interface DocumentAuditEntry {
  id: string;
  action: string;
  metadata: any;
  timestamp: string;
  userName: string | null;
  userId: string;
}

export interface DocumentShareEntry {
  id: string;
  shareType: string;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  sharedByName: string | null;
  sharedById: string;
  sharedWithId: string | null;
}

export interface DocumentUpdate {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  isPublic?: boolean;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useDocuments = (params?: {
  category?: string;
  search?: string;
}) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () =>
      getDocumentsAction({
        search: params?.search,
        category: params?.category,
      }) as unknown as Promise<DocumentListItem[]>,
    enabled: authReady,
    staleTime: 1000 * 60 * 3,
  });
};

export const useDocument = (id: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.documents.detail(id!),
    queryFn: () =>
      getDocumentByIdAction(id!) as unknown as Promise<DocumentDetail | null>,
    enabled: authReady && !!id,
    staleTime: 1000 * 60,
  });
};

export const useDocumentAuditTrail = (documentId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.documents.audit(documentId!),
    queryFn: () =>
      getDocumentAuditTrailAction(documentId!) as unknown as Promise<
        DocumentAuditEntry[]
      >,
    enabled: authReady && !!documentId,
    staleTime: 1000 * 30,
  });
};

export const useDocumentShares = (documentId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.documents.shares(documentId!),
    queryFn: () =>
      getDocumentSharesAction(documentId!) as unknown as Promise<
        DocumentShareEntry[]
      >,
    enabled: authReady && !!documentId,
    staleTime: 1000 * 30,
  });
};

// ============================================================================
// FILE UPLOAD (FormData — binary, no base64 overhead)
// ============================================================================

const uploadFileToServer = async (file: File): Promise<any> => {
  const accessToken = await getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents/server-upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to upload file: ${response.statusText}`,
    );
  }

  return response.json();
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFileToServer(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentData: DocumentUpdate) =>
      updateDocumentAction(documentData.id, documentData),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.detail(variables.id),
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocumentAction(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
    },
  });
};

export const useShareDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      sharedWithId,
      shareType,
    }: {
      documentId: string;
      sharedWithId: string;
      shareType?: string;
    }) => shareDocumentAction(documentId, sharedWithId, shareType),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.shares(variables.documentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.audit(variables.documentId),
      });
    },
  });
};

export const useRevokeShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeShareAction(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await getDownloadUrlAction(documentId);
      if (!result.success) throw new Error(result.error);
      // Open download URL in new tab
      window.open(result.data.url, "_blank");
      return result.data;
    },
  });
};
