import { reportError } from "./monitoring";

export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}

export function apiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; code?: unknown };
    return {
      message:
        typeof value.message === "string"
          ? value.message
          : "The operation failed.",
      ...(typeof value.code === "string" ? { code: value.code } : {}),
    };
  }
  return {
    message: typeof error === "string" ? error : "The operation failed.",
  };
}

export function invalidResult(message: string): ApiResult<never> {
  return { data: null, error: { code: "INVALID_INPUT", message } };
}

// Keep database failures and thrown transport/configuration failures on one path.
export async function runApi<T>(
  operation: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<ApiResult<T>> {
  try {
    const result = await operation();
    if (result.error) reportError(result.error, "api");
    return result.error
      ? { data: null, error: apiError(result.error) }
      : { data: result.data, error: null };
  } catch (error) {
    reportError(error, "api");
    return { data: null, error: apiError(error) };
  }
}
