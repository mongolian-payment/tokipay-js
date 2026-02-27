// =============================================================================
// Configuration
// =============================================================================

/** Configuration for the TokiPay client. */
export interface TokiPayConfig {
  /** Base URL of the TokiPay API (e.g. https://api.tokipay.mn) */
  endpoint: string;
  /** API key provided by TokiPay */
  apiKey: string;
  /** IM API key for POS endpoints */
  imApiKey: string;
  /** Authorization token string */
  authorization: string;
  /** Merchant ID assigned by TokiPay */
  merchantId: string;
  /** Default success redirect URL */
  successUrl: string;
  /** Default failure redirect URL */
  failureUrl: string;
  /** iOS app schema for deeplink generation */
  appSchemaIos?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Payment has been approved */
export const OrderStatusPaid = "APPROVED";
/** Payment has been completed */
export const OrderStatusCompleted = "COMPLETED";
/** Payment is pending */
export const OrderStatusPending = "PENDING";
/** Payment has been canceled */
export const OrderStatusCanceled = "EXPIRED";
/** Payment has expired */
export const OrderStatusExpired = "EXPIRED";

// =============================================================================
// Input types (SDK-facing)
// =============================================================================

/** Input for creating a payment. */
export interface TokiPayPaymentInput {
  /** Unique order identifier */
  orderId: string;
  /** Payment amount in MNT */
  amount: number;
  /** Payment description/notes */
  notes: string;
  /** Phone number (for send-to-user) */
  phoneNo?: string;
  /** Country code (for send-to-user, e.g. "+976") */
  countryCode?: string;
  /** Request ID (for scan user) */
  requestId?: string;
  /** Success URL override */
  successUrl?: string;
}

/** Input for refunding a payment. */
export interface TokiPayRefundInput {
  /** Request ID of the payment to refund */
  requestId: string;
  /** Amount to refund */
  refundAmount: number;
}

// =============================================================================
// Request types (wire format sent to API)
// =============================================================================

/** QR payment request body. */
export interface TokiPayPaymentQrRequest {
  successUrl: string;
  failureUrl: string;
  orderId: string;
  merchantId: string;
  amount: number;
  notes: string;
  authorization: string;
}

/** Send-to-user request body. */
export interface TokiPayPaymentSentUserRequest {
  successUrl: string;
  failureUrl: string;
  orderId: string;
  merchantId: string;
  amount: number;
  notes: string;
  authorization: string;
  phoneNo: string;
  countryCode: string;
}

/** Scan user request body. */
export interface TokiPayPaymentScanUserRequest {
  successUrl: string;
  failureUrl: string;
  orderId: string;
  merchantId: string;
  amount: number;
  notes: string;
  authorization: string;
  requestId: string;
}

/** Refund request body. */
export interface TokiPayRefundRequest {
  requestId: string;
  refundAmount: number;
  merchantId: string;
}

/** Deeplink request body. */
export interface TokiPayDeeplinkRequest {
  successUrl: string;
  failureUrl: string;
  orderId: string;
  merchantId: string;
  amount: number;
  notes: string;
  appSchemaIos: string;
  authorization: string;
  tokiWebSuccessUrl: string;
  tokiWebFailureUrl: string;
}

/** Third-party phone request body. */
export interface TokiPayThirdPartyPhoneRequest {
  successUrl: string;
  failureUrl: string;
  orderId: string;
  merchantId: string;
  amount: number;
  notes: string;
  phoneNo: string;
  countryCode: string;
  authorization: string;
  tokiWebSuccessUrl: string;
  tokiWebFailureUrl: string;
}

// =============================================================================
// Response types
// =============================================================================

/** Data returned from a payment request. */
export interface TokiPayPaymentRequestResponse {
  requestId: string;
}

/** Standard payment response. */
export interface TokiPayPaymentResponse {
  statusCode: number;
  error: string;
  message: string;
  data: TokiPayPaymentRequestResponse;
  type: string;
}

/** Data returned from a payment status check. */
export interface TokiPayPaymentStatusDataResponse {
  status: string;
}

/** Payment status response. */
export interface TokiPayPaymentStatusResponse {
  statusCode: number;
  error: string;
  message: string;
  data: TokiPayPaymentStatusDataResponse;
  type: string;
}

/** Extended payment response (for cancel, refund). */
export interface TokiPayPaymentResponseExt {
  statusCode: number;
  error: string;
  message: string;
  responseType: string;
}

/** Data returned from a deeplink request. */
export interface TokiPayDeeplinkDataResponse {
  deeplink: string;
}

/** Deeplink response. */
export interface TokiPayDeeplinkResponse {
  statusCode: number;
  error: string;
  message: string;
  data: TokiPayDeeplinkDataResponse;
  type: string;
}

/** Third-party phone response. */
export interface TokiPayThirdPartyPhoneResponse {
  statusCode: number;
  error: string;
  message: string;
  data: unknown;
  type: string;
}
