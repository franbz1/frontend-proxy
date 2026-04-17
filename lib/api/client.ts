import type { DemoUser } from "@/lib/types/demo";
import type {
  ApiErrorResponse,
  DailyUsageHistoryResponse,
  GenerationResponse,
  QuotaStatusResponse,
  UpgradeResponse,
} from "@/lib/types/quota";
import { ApiRequestError } from "@/lib/types/quota";

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  return base.replace(/\/$/, "");
}

function userHeaders(userId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-User-Id": userId,
  };
}

async function parseErrorBody(res: Response): Promise<ApiErrorResponse | null> {
  try {
    const data = (await res.json()) as ApiErrorResponse;
    if (data && typeof data.code === "string") return data;
  } catch {
    /* ignore */
  }
  return null;
}

function retryAfterFromResponse(
  res: Response,
  body: ApiErrorResponse | null
): number | null {
  if (body?.retryAfterSeconds != null && Number.isFinite(body.retryAfterSeconds)) {
    return body.retryAfterSeconds;
  }
  const header = res.headers.get("Retry-After");
  if (header) {
    const n = parseInt(header, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function handleErrorResponse(res: Response): Promise<never> {
  const body = await parseErrorBody(res);
  const retryAfter = retryAfterFromResponse(res, body);
  const message = body?.message ?? res.statusText ?? "Request failed";
  throw new ApiRequestError(message, res.status, body, retryAfter);
}

export async function getDemoUsers(): Promise<DemoUser[]> {
  const res = await fetch(`${getBaseUrl()}/api/demo/users`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) await handleErrorResponse(res);
  return res.json() as Promise<DemoUser[]>;
}

export async function postResetRateLimit(): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/demo/reset-rate-limit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) await handleErrorResponse(res);
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatusResponse> {
  const res = await fetch(`${getBaseUrl()}/api/quota/status`, {
    method: "GET",
    headers: userHeaders(userId),
    cache: "no-store",
  });
  if (!res.ok) await handleErrorResponse(res);
  return res.json() as Promise<QuotaStatusResponse>;
}

export async function getQuotaHistory(
  userId: string
): Promise<DailyUsageHistoryResponse> {
  const res = await fetch(`${getBaseUrl()}/api/quota/history`, {
    method: "GET",
    headers: userHeaders(userId),
    cache: "no-store",
  });
  if (!res.ok) await handleErrorResponse(res);
  return res.json() as Promise<DailyUsageHistoryResponse>;
}

export async function postGenerate(
  userId: string,
  prompt: string
): Promise<GenerationResponse> {
  const res = await fetch(`${getBaseUrl()}/api/ai/generate`, {
    method: "POST",
    headers: userHeaders(userId),
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) await handleErrorResponse(res);
  return res.json() as Promise<GenerationResponse>;
}

export async function postUpgrade(
  userId: string,
  simulateSuccess: boolean,
  paymentMethod: string
): Promise<UpgradeResponse> {
  const res = await fetch(`${getBaseUrl()}/api/quota/upgrade`, {
    method: "POST",
    headers: userHeaders(userId),
    body: JSON.stringify({ simulateSuccess, paymentMethod }),
  });
  if (!res.ok) await handleErrorResponse(res);
  return res.json() as Promise<UpgradeResponse>;
}
