import { AppError } from "@core/errors/AppError";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function actionSuccess<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function actionError(error: unknown): { success: false; error: string } {
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    console.error("Unexpected error in server action:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
  return { success: false, error: "An unexpected error occurred" };
}
