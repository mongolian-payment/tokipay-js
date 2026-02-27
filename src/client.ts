import type {
  TokiPayConfig,
  TokiPayPaymentInput,
  TokiPayRefundInput,
  TokiPayPaymentQrRequest,
  TokiPayPaymentSentUserRequest,
  TokiPayPaymentScanUserRequest,
  TokiPayRefundRequest,
  TokiPayDeeplinkRequest,
  TokiPayThirdPartyPhoneRequest,
  TokiPayPaymentResponse,
  TokiPayPaymentStatusResponse,
  TokiPayPaymentResponseExt,
  TokiPayDeeplinkResponse,
  TokiPayThirdPartyPhoneResponse,
} from "./types.js";
import { TokiPayError } from "./errors.js";

/** API key value used for POS endpoints. */
const POS_API_KEY = "spos_pay_v4";

/** API key value used for third-party endpoints. */
const THIRD_PARTY_API_KEY = "third_party_pay";

/**
 * TokiPay API client.
 *
 * Provides methods for POS payments (QR, send-to-user, scan-user, status,
 * cancel, refund) and third-party payments (deeplink, phone request, status).
 *
 * @example
 * ```ts
 * import { TokiPayClient } from "@mongolian-payment/tokipay";
 *
 * const client = new TokiPayClient({
 *   endpoint: "https://api.tokipay.mn",
 *   apiKey: "MY_API_KEY",
 *   imApiKey: "MY_IM_API_KEY",
 *   authorization: "MY_AUTH_TOKEN",
 *   merchantId: "MY_MERCHANT_ID",
 *   successUrl: "https://example.com/success",
 *   failureUrl: "https://example.com/failure",
 * });
 *
 * const result = await client.paymentQr({
 *   orderId: "order_123",
 *   amount: 10000,
 *   notes: "Test payment",
 * });
 * ```
 */
export class TokiPayClient {
  private readonly config: TokiPayConfig;

  constructor(config: TokiPayConfig) {
    this.config = config;
  }

  // ==========================================================================
  // HTTP helpers
  // ==========================================================================

  /**
   * Make an authenticated request to a POS endpoint.
   *
   * POS endpoints use:
   * - `api_key` header with value "spos_pay_v4"
   * - `im_api_key` header with the configured imApiKey
   * - `Authorization` header with the configured authorization token
   */
  private async posRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: this.config.authorization,
      api_key: POS_API_KEY,
      im_api_key: this.config.imApiKey,
    };

    return this.doRequest<T>(method, path, headers, body);
  }

  /**
   * Make an authenticated request to a third-party endpoint.
   *
   * Third-party endpoints use:
   * - `api_key` header with value "third_party_pay"
   * - `Authorization` header with the configured authorization token
   * - No `im_api_key` header
   */
  private async thirdPartyRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: this.config.authorization,
      api_key: THIRD_PARTY_API_KEY,
    };

    return this.doRequest<T>(method, path, headers, body);
  }

  /** Shared HTTP request execution. */
  private async doRequest<T>(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.config.endpoint}${path}`;

    const options: RequestInit = { method, headers };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    let responseBody: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      responseBody = await res.json();
    } else {
      responseBody = await res.text();
    }

    if (!res.ok) {
      throw new TokiPayError(
        `TokiPay API error: ${method} ${path} (${res.status})`,
        res.status,
        responseBody,
      );
    }

    // TokiPay also signals errors via statusCode in the JSON body
    const data = responseBody as Record<string, unknown>;
    if (
      typeof data === "object" &&
      data !== null &&
      "statusCode" in data &&
      data.statusCode !== 200
    ) {
      throw new TokiPayError(
        `TokiPay API error: ${(data.error as string) || (data.message as string) || "Unknown error"} (statusCode: ${data.statusCode})`,
        data.statusCode as number,
        responseBody,
      );
    }

    return responseBody as T;
  }

  // ==========================================================================
  // POS Methods
  // ==========================================================================

  /**
   * Create a QR payment request.
   *
   * @param input - Payment parameters (orderId, amount, notes)
   * @returns Payment response with requestId
   */
  async paymentQr(
    input: Pick<TokiPayPaymentInput, "orderId" | "amount" | "notes">,
  ): Promise<TokiPayPaymentResponse> {
    const body: TokiPayPaymentQrRequest = {
      successUrl: this.config.successUrl,
      failureUrl: this.config.failureUrl,
      orderId: input.orderId,
      merchantId: this.config.merchantId,
      amount: input.amount,
      notes: input.notes,
      authorization: this.config.authorization,
    };

    return this.posRequest<TokiPayPaymentResponse>(
      "POST",
      "/jump/v4/spose/payment/request",
      body,
    );
  }

  /**
   * Send a payment request to a specific user by phone number.
   *
   * @param input - Payment parameters including phoneNo and countryCode
   * @returns Payment response with requestId
   */
  async paymentSendToUser(
    input: Pick<
      TokiPayPaymentInput,
      "orderId" | "amount" | "notes" | "phoneNo" | "countryCode"
    >,
  ): Promise<TokiPayPaymentResponse> {
    const body: TokiPayPaymentSentUserRequest = {
      successUrl: this.config.successUrl,
      failureUrl: this.config.failureUrl,
      orderId: input.orderId,
      merchantId: this.config.merchantId,
      amount: input.amount,
      notes: input.notes,
      authorization: this.config.authorization,
      phoneNo: input.phoneNo!,
      countryCode: input.countryCode!,
    };

    return this.posRequest<TokiPayPaymentResponse>(
      "POST",
      "/jump/v4/spose/payment/user-request",
      body,
    );
  }

  /**
   * Create a payment request by scanning a user's QR code.
   *
   * @param input - Payment parameters including requestId from scanned QR
   * @returns Payment response with requestId
   */
  async paymentScanUser(
    input: Pick<
      TokiPayPaymentInput,
      "orderId" | "amount" | "notes" | "requestId"
    >,
  ): Promise<TokiPayPaymentResponse> {
    const body: TokiPayPaymentScanUserRequest = {
      successUrl: this.config.successUrl,
      failureUrl: this.config.failureUrl,
      orderId: input.orderId,
      merchantId: this.config.merchantId,
      amount: input.amount,
      notes: input.notes,
      authorization: this.config.authorization,
      requestId: input.requestId!,
    };

    return this.posRequest<TokiPayPaymentResponse>(
      "POST",
      "/jump/v4/spose/payment/scan/user-request",
      body,
    );
  }

  /**
   * Check the status of a POS payment.
   *
   * @param requestId - The request ID returned from a payment request
   * @returns Payment status response
   */
  async paymentStatus(
    requestId: string,
  ): Promise<TokiPayPaymentStatusResponse> {
    return this.posRequest<TokiPayPaymentStatusResponse>(
      "GET",
      `/jump/v4/spose/payment/status?requestId=${encodeURIComponent(requestId)}`,
    );
  }

  /**
   * Cancel a POS payment.
   *
   * @param requestId - The request ID of the payment to cancel
   * @returns Extended payment response
   */
  async paymentCancel(
    requestId: string,
  ): Promise<TokiPayPaymentResponseExt> {
    return this.posRequest<TokiPayPaymentResponseExt>(
      "DELETE",
      `/jump/v4/spose/payment/request?requestId=${encodeURIComponent(requestId)}`,
    );
  }

  /**
   * Refund a POS payment.
   *
   * @param input - Refund parameters (requestId, refundAmount)
   * @returns Extended payment response
   */
  async paymentRefund(
    input: TokiPayRefundInput,
  ): Promise<TokiPayPaymentResponseExt> {
    const body: TokiPayRefundRequest = {
      requestId: input.requestId,
      refundAmount: input.refundAmount,
      merchantId: this.config.merchantId,
    };

    return this.posRequest<TokiPayPaymentResponseExt>(
      "PUT",
      "/jump/v4/spose/payment/refund",
      body,
    );
  }

  // ==========================================================================
  // Third-Party Methods
  // ==========================================================================

  /**
   * Create a third-party deeplink payment.
   *
   * @param input - Payment parameters (orderId, amount, notes, optional successUrl)
   * @returns Deeplink response containing the payment deeplink URL
   */
  async thirdPartyDeeplink(
    input: Pick<
      TokiPayPaymentInput,
      "orderId" | "amount" | "notes" | "successUrl"
    >,
  ): Promise<TokiPayDeeplinkResponse> {
    const body: TokiPayDeeplinkRequest = {
      successUrl: input.successUrl ?? this.config.successUrl,
      failureUrl: this.config.failureUrl,
      orderId: input.orderId,
      merchantId: this.config.merchantId,
      amount: input.amount,
      notes: input.notes,
      appSchemaIos: this.config.appSchemaIos ?? "",
      authorization: this.config.authorization,
      tokiWebSuccessUrl: input.successUrl ?? this.config.successUrl,
      tokiWebFailureUrl: this.config.failureUrl,
    };

    return this.thirdPartyRequest<TokiPayDeeplinkResponse>(
      "POST",
      "/jump/v1/third-party/payment/deeplink",
      body,
    );
  }

  /**
   * Create a third-party payment request via phone number.
   *
   * @param input - Payment parameters including phoneNo
   * @returns Third-party phone response
   */
  async thirdPartyPhoneRequest(
    input: Pick<
      TokiPayPaymentInput,
      "orderId" | "amount" | "notes" | "phoneNo"
    >,
  ): Promise<TokiPayThirdPartyPhoneResponse> {
    const body: TokiPayThirdPartyPhoneRequest = {
      successUrl: this.config.successUrl,
      failureUrl: this.config.failureUrl,
      orderId: input.orderId,
      merchantId: this.config.merchantId,
      amount: input.amount,
      notes: input.notes,
      phoneNo: input.phoneNo!,
      countryCode: "+976",
      authorization: this.config.authorization,
      tokiWebSuccessUrl: this.config.successUrl,
      tokiWebFailureUrl: this.config.failureUrl,
    };

    return this.thirdPartyRequest<TokiPayThirdPartyPhoneResponse>(
      "POST",
      "/jump/v1/third-party/payment/request",
      body,
    );
  }

  /**
   * Check the status of a third-party payment.
   *
   * @param requestId - The request ID returned from a payment request
   * @returns Payment status response
   */
  async thirdPartyStatus(
    requestId: string,
  ): Promise<TokiPayPaymentStatusResponse> {
    return this.thirdPartyRequest<TokiPayPaymentStatusResponse>(
      "GET",
      `/jump/v1/third-party/payment/status?requestId=${encodeURIComponent(requestId)}`,
    );
  }
}
