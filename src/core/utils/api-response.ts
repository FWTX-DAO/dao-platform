import type { NextApiResponse } from 'next';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const apiResponse = {
  success<T>(res: NextApiResponse, data: T, statusCode = 200) {
    return res.status(statusCode).json({ data } as ApiResponse<T>);
  },

  error(res: NextApiResponse, error: string, statusCode = 400) {
    return res.status(statusCode).json({ error } as ApiResponse);
  },

  notFound(res: NextApiResponse, resource = 'Resource') {
    return res.status(404).json({ 
      error: `${resource} not found` 
    } as ApiResponse);
  },

  unauthorized(res: NextApiResponse, message = 'Unauthorized') {
    return res.status(401).json({ error: message } as ApiResponse);
  },

  forbidden(res: NextApiResponse, message = 'Forbidden') {
    return res.status(403).json({ error: message } as ApiResponse);
  },
};
