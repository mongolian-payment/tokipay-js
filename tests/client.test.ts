import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokiPayClient } from "../src/client.js";
import { TokiPayError } from "../src/errors.js";
import type { TokiPayConfig } from "../src/types.js";

const TEST_CONFIG: TokiPayConfig = {
  endpoint: "https://api.tokipay.mn",
  apiKey: "test_api_key",
  imApiKey: "test_im_api_key",
  authorization: "test_auth_token",
  merchantId: "test_merchant",
  successUrl: "https://example.com/success",
  failureUrl: "https://example.com/failure",
  appSchemaIos: "myapp://",
};

// =============================================================================
// Mock responses
// =============================================================================

const MOCK_PAYMENT_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Success",
  data: { requestId: "req_123" },
  type: "QR",
};

const MOCK_STATUS_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Success",
  data: { status: "APPROVED" },
  type: "STATUS",
};

const MOCK_CANCEL_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Cancelled",
  responseType: "CANCEL",
};

const MOCK_REFUND_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Refunded",
  responseType: "REFUND",
};

const MOCK_DEEPLINK_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Success",
  data: { deeplink: "tokipay://pay?id=dl_123" },
  type: "DEEPLINK",
};

const MOCK_PHONE_RESPONSE = {
  statusCode: 200,
  error: "",
  message: "Success",
  data: null,
  type: "PHONE",
};

// =============================================================================
// Helpers
// =============================================================================

function mockFetchResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

// =============================================================================
// Tests
// =============================================================================

describe("TokiPayClient", () => {
  let client: TokiPayClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new TokiPayClient(TEST_CONFIG);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // POS: paymentQr
  // ===========================================================================

  describe("paymentQr", () => {
    it("should send QR payment request with correct headers and body", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_PAYMENT_RESPONSE));

      const result = await client.paymentQr({
        orderId: "order_1",
        amount: 5000,
        notes: "Test QR payment",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/request",
      );
      expect(options.method).toBe("POST");

      // Verify POS headers
      expect(options.headers.api_key).toBe("spos_pay_v4");
      expect(options.headers.im_api_key).toBe("test_im_api_key");
      expect(options.headers.Authorization).toBe("test_auth_token");

      // Verify body
      const sentBody = JSON.parse(options.body);
      expect(sentBody).toEqual({
        successUrl: "https://example.com/success",
        failureUrl: "https://example.com/failure",
        orderId: "order_1",
        merchantId: "test_merchant",
        amount: 5000,
        notes: "Test QR payment",
        authorization: "test_auth_token",
      });

      // Verify response
      expect(result.statusCode).toBe(200);
      expect(result.data.requestId).toBe("req_123");
    });
  });

  // ===========================================================================
  // POS: paymentSendToUser
  // ===========================================================================

  describe("paymentSendToUser", () => {
    it("should send user payment request with phone info", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_PAYMENT_RESPONSE));

      const result = await client.paymentSendToUser({
        orderId: "order_2",
        amount: 3000,
        notes: "Send to user",
        phoneNo: "99001122",
        countryCode: "+976",
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/user-request",
      );

      const sentBody = JSON.parse(options.body);
      expect(sentBody.phoneNo).toBe("99001122");
      expect(sentBody.countryCode).toBe("+976");
      expect(sentBody.orderId).toBe("order_2");
      expect(sentBody.amount).toBe(3000);

      expect(result.data.requestId).toBe("req_123");
    });
  });

  // ===========================================================================
  // POS: paymentScanUser
  // ===========================================================================

  describe("paymentScanUser", () => {
    it("should send scan user request with requestId", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_PAYMENT_RESPONSE));

      const result = await client.paymentScanUser({
        orderId: "order_3",
        amount: 2000,
        notes: "Scan user",
        requestId: "scan_req_456",
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/scan/user-request",
      );

      const sentBody = JSON.parse(options.body);
      expect(sentBody.requestId).toBe("scan_req_456");
      expect(sentBody.orderId).toBe("order_3");

      expect(result.data.requestId).toBe("req_123");
    });
  });

  // ===========================================================================
  // POS: paymentStatus
  // ===========================================================================

  describe("paymentStatus", () => {
    it("should check payment status with correct URL", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_STATUS_RESPONSE));

      const result = await client.paymentStatus("req_123");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/status?requestId=req_123",
      );
      expect(options.method).toBe("GET");

      // Verify POS headers
      expect(options.headers.api_key).toBe("spos_pay_v4");
      expect(options.headers.im_api_key).toBe("test_im_api_key");

      expect(result.data.status).toBe("APPROVED");
    });
  });

  // ===========================================================================
  // POS: paymentCancel
  // ===========================================================================

  describe("paymentCancel", () => {
    it("should cancel payment with DELETE request", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_CANCEL_RESPONSE));

      const result = await client.paymentCancel("req_123");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/request?requestId=req_123",
      );
      expect(options.method).toBe("DELETE");

      expect(result.message).toBe("Cancelled");
    });
  });

  // ===========================================================================
  // POS: paymentRefund
  // ===========================================================================

  describe("paymentRefund", () => {
    it("should send refund with correct body", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_REFUND_RESPONSE));

      const result = await client.paymentRefund({
        requestId: "req_123",
        refundAmount: 1500,
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v4/spose/payment/refund",
      );
      expect(options.method).toBe("PUT");

      const sentBody = JSON.parse(options.body);
      expect(sentBody).toEqual({
        requestId: "req_123",
        refundAmount: 1500,
        merchantId: "test_merchant",
      });

      expect(result.message).toBe("Refunded");
    });
  });

  // ===========================================================================
  // Third-Party: thirdPartyDeeplink
  // ===========================================================================

  describe("thirdPartyDeeplink", () => {
    it("should create deeplink with third-party headers", async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(MOCK_DEEPLINK_RESPONSE),
      );

      const result = await client.thirdPartyDeeplink({
        orderId: "order_tp_1",
        amount: 8000,
        notes: "Deeplink payment",
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v1/third-party/payment/deeplink",
      );
      expect(options.method).toBe("POST");

      // Verify third-party headers (no im_api_key)
      expect(options.headers.api_key).toBe("third_party_pay");
      expect(options.headers.im_api_key).toBeUndefined();
      expect(options.headers.Authorization).toBe("test_auth_token");

      const sentBody = JSON.parse(options.body);
      expect(sentBody.appSchemaIos).toBe("myapp://");
      expect(sentBody.tokiWebSuccessUrl).toBe(
        "https://example.com/success",
      );
      expect(sentBody.tokiWebFailureUrl).toBe(
        "https://example.com/failure",
      );

      expect(result.data.deeplink).toBe("tokipay://pay?id=dl_123");
    });

    it("should use override successUrl when provided", async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(MOCK_DEEPLINK_RESPONSE),
      );

      await client.thirdPartyDeeplink({
        orderId: "order_tp_2",
        amount: 4000,
        notes: "Custom success",
        successUrl: "https://custom.com/success",
      });

      const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sentBody.successUrl).toBe("https://custom.com/success");
      expect(sentBody.tokiWebSuccessUrl).toBe("https://custom.com/success");
      // failureUrl should still use config default
      expect(sentBody.failureUrl).toBe("https://example.com/failure");
    });
  });

  // ===========================================================================
  // Third-Party: thirdPartyPhoneRequest
  // ===========================================================================

  describe("thirdPartyPhoneRequest", () => {
    it("should send phone request with correct body", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_PHONE_RESPONSE));

      const result = await client.thirdPartyPhoneRequest({
        orderId: "order_tp_3",
        amount: 6000,
        notes: "Phone request",
        phoneNo: "88112233",
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v1/third-party/payment/request",
      );

      // Verify third-party headers
      expect(options.headers.api_key).toBe("third_party_pay");
      expect(options.headers.im_api_key).toBeUndefined();

      const sentBody = JSON.parse(options.body);
      expect(sentBody.phoneNo).toBe("88112233");
      expect(sentBody.countryCode).toBe("+976");
      expect(sentBody.tokiWebSuccessUrl).toBe(
        "https://example.com/success",
      );

      expect(result.statusCode).toBe(200);
    });
  });

  // ===========================================================================
  // Third-Party: thirdPartyStatus
  // ===========================================================================

  describe("thirdPartyStatus", () => {
    it("should check third-party status with correct URL and headers", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(MOCK_STATUS_RESPONSE));

      const result = await client.thirdPartyStatus("req_tp_789");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://api.tokipay.mn/jump/v1/third-party/payment/status?requestId=req_tp_789",
      );
      expect(options.method).toBe("GET");

      // Verify third-party headers
      expect(options.headers.api_key).toBe("third_party_pay");
      expect(options.headers.im_api_key).toBeUndefined();

      expect(result.data.status).toBe("APPROVED");
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("should throw TokiPayError on HTTP error", async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ error: "unauthorized" }, 401),
      );

      try {
        await client.paymentQr({
          orderId: "order_err",
          amount: 1000,
          notes: "Error test",
        });
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TokiPayError);
        const tokiErr = err as TokiPayError;
        expect(tokiErr.statusCode).toBe(401);
        expect(tokiErr.response).toEqual({ error: "unauthorized" });
      }
    });

    it("should throw TokiPayError when statusCode !== 200 in response body", async () => {
      const errorResponse = {
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid amount",
        data: null,
        type: "ERROR",
      };
      fetchMock.mockResolvedValueOnce(mockFetchResponse(errorResponse));

      try {
        await client.paymentQr({
          orderId: "order_err2",
          amount: -100,
          notes: "Negative amount",
        });
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TokiPayError);
        const tokiErr = err as TokiPayError;
        expect(tokiErr.statusCode).toBe(400);
        expect(tokiErr.message).toContain("Bad Request");
      }
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        client.paymentStatus("req_net_err"),
      ).rejects.toThrow("Network error");
    });
  });
});

// =============================================================================
// loadConfigFromEnv
// =============================================================================

describe("loadConfigFromEnv", () => {
  it("should load config from environment variables", async () => {
    const { loadConfigFromEnv } = await import("../src/config.js");

    process.env.TOKIPAY_ENDPOINT = "https://api.tokipay.mn";
    process.env.TOKIPAY_API_KEY = "api_key";
    process.env.TOKIPAY_IM_API_KEY = "im_key";
    process.env.TOKIPAY_AUTHORIZATION = "auth_token";
    process.env.TOKIPAY_MERCHANT_ID = "merchant_1";
    process.env.TOKIPAY_SUCCESS_URL = "https://example.com/success";
    process.env.TOKIPAY_FAILURE_URL = "https://example.com/failure";
    process.env.TOKIPAY_APP_SCHEMA_IOS = "myapp://";

    const config = loadConfigFromEnv();
    expect(config.endpoint).toBe("https://api.tokipay.mn");
    expect(config.apiKey).toBe("api_key");
    expect(config.imApiKey).toBe("im_key");
    expect(config.authorization).toBe("auth_token");
    expect(config.merchantId).toBe("merchant_1");
    expect(config.successUrl).toBe("https://example.com/success");
    expect(config.failureUrl).toBe("https://example.com/failure");
    expect(config.appSchemaIos).toBe("myapp://");

    // Cleanup
    delete process.env.TOKIPAY_ENDPOINT;
    delete process.env.TOKIPAY_API_KEY;
    delete process.env.TOKIPAY_IM_API_KEY;
    delete process.env.TOKIPAY_AUTHORIZATION;
    delete process.env.TOKIPAY_MERCHANT_ID;
    delete process.env.TOKIPAY_SUCCESS_URL;
    delete process.env.TOKIPAY_FAILURE_URL;
    delete process.env.TOKIPAY_APP_SCHEMA_IOS;
  });

  it("should throw if required env vars are missing", async () => {
    const { loadConfigFromEnv } = await import("../src/config.js");

    // Make sure none are set
    delete process.env.TOKIPAY_ENDPOINT;
    delete process.env.TOKIPAY_API_KEY;
    delete process.env.TOKIPAY_IM_API_KEY;
    delete process.env.TOKIPAY_AUTHORIZATION;
    delete process.env.TOKIPAY_MERCHANT_ID;
    delete process.env.TOKIPAY_SUCCESS_URL;
    delete process.env.TOKIPAY_FAILURE_URL;

    expect(() => loadConfigFromEnv()).toThrow(
      "Missing required environment variables",
    );
  });
});

// =============================================================================
// Constants
// =============================================================================

describe("constants", () => {
  it("should export correct order status constants", async () => {
    const {
      OrderStatusPaid,
      OrderStatusCompleted,
      OrderStatusPending,
      OrderStatusCanceled,
      OrderStatusExpired,
    } = await import("../src/types.js");

    expect(OrderStatusPaid).toBe("APPROVED");
    expect(OrderStatusCompleted).toBe("COMPLETED");
    expect(OrderStatusPending).toBe("PENDING");
    expect(OrderStatusCanceled).toBe("EXPIRED");
    expect(OrderStatusExpired).toBe("EXPIRED");
  });
});
