# @mongolian-payment/tokipay

TokiPay payment SDK for Node.js — QR payments, send-to-user, deeplinks, and refunds.

[![npm version](https://img.shields.io/npm/v/@mongolian-payment/tokipay.svg)](https://www.npmjs.com/package/@mongolian-payment/tokipay)
[![license](https://img.shields.io/npm/l/@mongolian-payment/tokipay.svg)](./LICENSE)

> Part of the **[mongolian-payment](https://github.com/mongolian-payment)** SDK suite.
> Also available for Python: **[mongolian-payment-tokipay](https://pypi.org/project/mongolian-payment-tokipay/)** ([source](https://github.com/mongolian-payment/tokipay-py)).

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## Installation

```bash
npm install @mongolian-payment/tokipay
```

## Quick Start

```typescript
import { TokiPayClient } from "@mongolian-payment/tokipay";

const client = new TokiPayClient({
  endpoint: "https://api.tokipay.mn",
  apiKey: "YOUR_API_KEY",
  imApiKey: "YOUR_IM_API_KEY",
  authorization: "YOUR_AUTH_TOKEN",
  merchantId: "YOUR_MERCHANT_ID",
  successUrl: "https://yourapp.com/success",
  failureUrl: "https://yourapp.com/failure",
});

// Create a QR payment
const payment = await client.paymentQr({
  orderId: "ORDER-001",
  amount: 50000,
  notes: "Payment for order #001",
});
console.log(payment.data.requestId);

// Check payment status
const status = await client.paymentStatus(payment.data.requestId);
console.log(status.data.status); // APPROVED, COMPLETED, PENDING, EXPIRED
```

## Configuration from Environment Variables

```typescript
import { TokiPayClient, loadConfigFromEnv } from "@mongolian-payment/tokipay";

const client = new TokiPayClient(loadConfigFromEnv());
```

| Variable                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `TOKIPAY_ENDPOINT`       | API base URL                                 |
| `TOKIPAY_API_KEY`        | API key provided by TokiPay                  |
| `TOKIPAY_IM_API_KEY`     | IM API key for POS endpoints                 |
| `TOKIPAY_AUTHORIZATION`  | Authorization token string                   |
| `TOKIPAY_MERCHANT_ID`    | Merchant ID assigned by TokiPay              |
| `TOKIPAY_SUCCESS_URL`    | Default success redirect URL                 |
| `TOKIPAY_FAILURE_URL`    | Default failure redirect URL                 |
| `TOKIPAY_APP_SCHEMA_IOS` | iOS app schema for deeplinks (optional)      |

> Never hard-code credentials — load them from the environment or a secrets vault.

## API Reference

POS methods authenticate with the `spos_pay_v4` API key; third-party methods use the
`third_party_pay` API key. Both are applied automatically.

| Method | Description |
|--------|-------------|
| `paymentQr(input)` | Create a QR payment → `{ data: { requestId } }` |
| `paymentSendToUser(input)` | Send a payment request to a user by phone number |
| `paymentScanUser(input)` | Create a payment by scanning a user's QR |
| `paymentStatus(requestId)` | Check POS payment status |
| `paymentCancel(requestId)` | Cancel a POS payment |
| `paymentRefund(input)` | Refund a POS payment |
| `thirdPartyDeeplink(input)` | Create a third-party deeplink payment → `{ data: { deeplink } }` |
| `thirdPartyPhoneRequest(input)` | Create a third-party payment request by phone |
| `thirdPartyStatus(requestId)` | Check third-party payment status |

```typescript
// Send a payment to a user by phone
const sent = await client.paymentSendToUser({
  orderId: "ORDER-002",
  amount: 30000,
  notes: "Order payment",
  phoneNo: "99001122",
  countryCode: "+976",
});

// Third-party deeplink
const deeplink = await client.thirdPartyDeeplink({
  orderId: "ORDER-003",
  amount: 25000,
  notes: "Purchase",
});
console.log(deeplink.data.deeplink);

// Cancel and refund
await client.paymentCancel(payment.data.requestId);
await client.paymentRefund({
  requestId: payment.data.requestId,
  refundAmount: 50000,
});
```

Payment status values: `APPROVED` (paid), `COMPLETED`, `PENDING`, `EXPIRED`
(canceled/expired). These are exported as `OrderStatusPaid`,
`OrderStatusCompleted`, `OrderStatusPending`, `OrderStatusCanceled`, and
`OrderStatusExpired`.

## Error Handling

All API errors throw `TokiPayError`, which includes the HTTP status code and response body:

```typescript
import { TokiPayError } from "@mongolian-payment/tokipay";

try {
  await client.paymentStatus("invalid_id");
} catch (err) {
  if (err instanceof TokiPayError) {
    console.error(err.message);    // Human-readable message
    console.error(err.statusCode); // HTTP status code (e.g. 404)
    console.error(err.response);   // Raw response body
  }
}
```

## License

MIT
