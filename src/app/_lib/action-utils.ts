import { AppError } from '@core/errors/AppError';

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export function actionError(error: unknown): { success: false; error: string } {
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'An unexpected error occurred' };
}
