import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { z, type ZodSchema } from 'zod';

export function withValidation<T extends ZodSchema>(schema: T) {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        req.body = schema.parse(req.body);
        return handler(req, res);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Validation failed',
            details: error.errors 
          });
        }
        throw error;
      }
    };
  };
}
