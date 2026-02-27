import type { TokiPayConfig } from "./types.js";

/**
 * Loads TokiPay configuration from environment variables.
 *
 * Expected environment variables:
 * - `TOKIPAY_ENDPOINT` - TokiPay API base URL
 * - `TOKIPAY_API_KEY` - API key provided by TokiPay
 * - `TOKIPAY_IM_API_KEY` - IM API key for POS endpoints
 * - `TOKIPAY_AUTHORIZATION` - Authorization token string
 * - `TOKIPAY_MERCHANT_ID` - Merchant ID assigned by TokiPay
 * - `TOKIPAY_SUCCESS_URL` - Default success redirect URL
 * - `TOKIPAY_FAILURE_URL` - Default failure redirect URL
 * - `TOKIPAY_APP_SCHEMA_IOS` - (optional) iOS app schema for deeplinks
 *
 * @throws {Error} If any required environment variable is missing
 */
export function loadConfigFromEnv(): TokiPayConfig {
  const required: Array<[keyof TokiPayConfig, string]> = [
    ["endpoint", "TOKIPAY_ENDPOINT"],
    ["apiKey", "TOKIPAY_API_KEY"],
    ["imApiKey", "TOKIPAY_IM_API_KEY"],
    ["authorization", "TOKIPAY_AUTHORIZATION"],
    ["merchantId", "TOKIPAY_MERCHANT_ID"],
    ["successUrl", "TOKIPAY_SUCCESS_URL"],
    ["failureUrl", "TOKIPAY_FAILURE_URL"],
  ];

  const config: Record<string, string> = {};

  const missing: string[] = [];
  for (const [key, envVar] of required) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      config[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const appSchemaIos = process.env.TOKIPAY_APP_SCHEMA_IOS;
  if (appSchemaIos) {
    config.appSchemaIos = appSchemaIos;
  }

  return config as unknown as TokiPayConfig;
}
