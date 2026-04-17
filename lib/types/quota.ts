export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export interface RateLimitInfo {
  requestsUsedThisWindow: number;
  requestsLimitPerMinute: number | null;
  rateLimitResetAt: string;
}

export interface QuotaStatusResponse {
  plan: Plan;
  tokensUsedThisMonth: number;
  tokensRemainingThisMonth: number | null;
  monthlyTokenLimit: number | null;
  monthlyResetAt: string;
  rateLimit: RateLimitInfo;
}

export interface DailyUsageDay {
  date: string;
  tokensUsed: number;
}

export interface DailyUsageHistoryResponse {
  days: DailyUsageDay[];
}

export interface GenerationResponse {
  text: string;
  tokensCharged: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  quotaStatus: QuotaStatusResponse;
}

export interface UpgradeResponse {
  plan: string;
  paymentAccepted: boolean;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  retryAfterSeconds: number | null;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    status: number,
    body: ApiErrorResponse | null,
    retryAfterSeconds: number | null
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
