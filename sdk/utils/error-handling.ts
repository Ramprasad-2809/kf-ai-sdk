// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================
// Type-safe error handling utilities for the SDK

/**
 * Safely convert unknown error to Error object
 * Handles all possible error types that could be thrown
 */
export function toError(err: unknown): Error {
  // Already an Error instance
  if (err instanceof Error) {
    return err;
  }

  // String error
  if (typeof err === "string") {
    return new Error(err);
  }

  // Object with message property
  if (
    err !== null &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const error = new Error((err as { message: string }).message);
    // Preserve any additional properties
    Object.assign(error, err);
    return error;
  }

  // Fallback: convert to string
  return new Error(String(err));
}

/**
 * Type guard to check if a value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if error has a specific code
 */
export function hasErrorCode(
  err: unknown,
  code: string
): err is Error & { code: string } {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as Error & { code: unknown }).code === code
  );
}

/**
 * Type guard to check if error is a network error
 */
export function isNetworkError(err: unknown): boolean {
  if (!isError(err)) return false;

  const message = err.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    hasErrorCode(err, "NETWORK_ERROR") ||
    hasErrorCode(err, "ENOTFOUND") ||
    hasErrorCode(err, "ECONNREFUSED")
  );
}

/**
 * Type guard to check if error is a timeout error
 */
export function isTimeoutError(err: unknown): boolean {
  if (!isError(err)) return false;

  return (
    err.message.toLowerCase().includes("timeout") ||
    hasErrorCode(err, "TIMEOUT") ||
    hasErrorCode(err, "ETIMEDOUT")
  );
}

/**
 * Type guard to check if error is an abort error
 */
export function isAbortError(err: unknown): boolean {
  if (!isError(err)) return false;

  return err.name === "AbortError" || hasErrorCode(err, "ABORT_ERR");
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(err: unknown): string {
  if (isError(err)) {
    return err.message;
  }

  if (typeof err === "string") {
    return err;
  }

  if (
    err !== null &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }

  return String(err);
}

/**
 * Safe error handler wrapper for async functions
 * Returns a tuple of [result, error]
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err) {
    return [null, toError(err)];
  }
}

/**
 * Create a wrapped error with original error as cause
 */
export function wrapError(message: string, cause: unknown): Error {
  const error = new Error(message);
  // Use Object.defineProperty for broader compatibility
  Object.defineProperty(error, 'cause', {
    value: toError(cause),
    writable: true,
    enumerable: false,
    configurable: true,
  });
  return error;
}
