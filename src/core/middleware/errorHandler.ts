import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { AppError, ValidationError } from '../errors/AppError';
import { ZodError } from 'zod';

export const errorHandler = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          ...(error instanceof ValidationError && { details: error.details }),
        });
      }
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
};
