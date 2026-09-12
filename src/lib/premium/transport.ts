import { accessToken } from "./auth";
import { isPremiumBackendConfigured, publishableKey, supabaseUrl } from "./client";
import { PremiumApiError } from "./errors";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringField = (value: unknown) => typeof value === "string" ? value : undefined;

async function readResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
    throw new PremiumApiError(
      stringField(error.message) ?? "서버 요청을 처리하지 못했습니다.",
      stringField(error.code),
      response.status,
      stringField(error.requestId),
    );
  }
  if (!isRecord(payload) || !("data" in payload)) {
    throw new PremiumApiError("서버 응답 형식을 확인하지 못했습니다.", "INVALID_RESPONSE", response.status);
  }
  return payload.data as T;
}

function authenticatedFetch(
  functionName: string,
  path: string,
  init: RequestInit,
  token: string,
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("apikey", publishableKey);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(`${supabaseUrl}/functions/v1/${functionName}${path}`, {
    ...init,
    headers,
  });
}

export async function apiRequest<T>(
  functionName: string,
  path = "",
  init: RequestInit = {},
): Promise<T> {
  let response = await authenticatedFetch(functionName, path, init, await accessToken());

  // A browser tab can resume before Supabase's visibility-based auto refresh finishes.
  // A 401 means the Edge Function rejected the request before domain work ran, so the
  // same request (and the same idempotency key for mutations) is safe to retry once.
  if (response.status === 401) {
    response = await authenticatedFetch(functionName, path, init, await accessToken(true));
  }

  return readResponse<T>(response);
}

export async function publicApiRequest<T>(functionName: string): Promise<T> {
  if (!isPremiumBackendConfigured) {
    throw new PremiumApiError("Premium 서버 설정이 없습니다.", "PREMIUM_NOT_CONFIGURED");
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    headers: { apikey: publishableKey },
  });
  return readResponse<T>(response);
}
