/**
 * Custom error class for TokiPay API errors.
 *
 * Includes the HTTP status code and raw response body when available.
 */
export class TokiPayError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "TokiPayError";
  }
}
