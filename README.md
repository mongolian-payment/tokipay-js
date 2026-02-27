# @mongolian-payment/tokipay

TokiPay payment SDK for Node.js — QR payments, deeplink payments, send to user, refunds, and more.

## Installation

```bash
npm install @mongolian-payment/tokipay
```

## Quick Start

```typescript
import { TokiPayClient } from '@mongolian-payment/tokipay';

const client = new TokiPayClient({
  endpoint: 'https://api.tokipay.mn',
  apiKey: 'your-api-key',
  imApiKey: 'your-im-api-key',
  authorization: 'your-authorization-token',
  merchantId: 'your-merchant-id',
  successUrl: 'https://yoursite.com/success',
  failureUrl: 'https://yoursite.com/failure',
});

// QR Payment
const payment = await client.paymentQr({
  orderId: 'ORDER-001',
  amount: 50000,
  notes: 'Payment for order #001',
});
console.log(payment.data.requestId);

// Check payment status
const status = await client.paymentStatus(payment.data.requestId);
console.log(status.data.status); // APPROVED, PENDING, EXPIRED, COMPLETED

// Send payment to user by phone
const sent = await client.paymentSendToUser({
  orderId: 'ORDER-002',
  amount: 30000,
  notes: 'Refund',
  phoneNo: '99001122',
  countryCode: '+976',
});

// Third-party deeplink
const deeplink = await client.thirdPartyDeeplink({
  orderId: 'ORDER-003',
  amount: 25000,
  notes: 'Purchase',
});
console.log(deeplink.data.deeplink);

// Cancel payment
await client.paymentCancel(payment.data.requestId);

// Refund payment
await client.paymentRefund({
  requestId: payment.data.requestId,
  refundAmount: 50000,
});
```

## Environment Variables

```bash
TOKIPAY_ENDPOINT=https://api.tokipay.mn
TOKIPAY_API_KEY=your-api-key
TOKIPAY_IM_API_KEY=your-im-api-key
TOKIPAY_AUTHORIZATION=your-auth-token
TOKIPAY_MERCHANT_ID=your-merchant-id
TOKIPAY_SUCCESS_URL=https://yoursite.com/success
TOKIPAY_FAILURE_URL=https://yoursite.com/failure
TOKIPAY_APP_SCHEMA_IOS=your-ios-schema
```

```typescript
import { TokiPayClient, loadConfigFromEnv } from '@mongolian-payment/tokipay';
const client = new TokiPayClient(loadConfigFromEnv());
```

## API Methods

### POS Methods
| Method | Description |
|--------|-------------|
| `paymentQr(input)` | Generate QR payment |
| `paymentSendToUser(input)` | Send payment to user |
| `paymentScanUser(input)` | Scan user for payment |
| `paymentStatus(requestId)` | Check payment status |
| `paymentCancel(requestId)` | Cancel payment |
| `paymentRefund(input)` | Refund payment |

### Third-Party Methods
| Method | Description |
|--------|-------------|
| `thirdPartyDeeplink(input)` | Create deeplink payment |
| `thirdPartyPhoneRequest(input)` | Phone-based payment request |
| `thirdPartyStatus(requestId)` | Check third-party status |

## Order Statuses

| Status | Value |
|--------|-------|
| Paid | `APPROVED` |
| Completed | `COMPLETED` |
| Pending | `PENDING` |
| Canceled/Expired | `EXPIRED` |

## License

MIT
