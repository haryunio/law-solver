import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { createId } from "./id";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
const SESSION_REFRESH_LEEWAY_SECONDS = 60;

export const isPremiumBackendConfigured = Boolean(supabaseUrl && publishableKey);
export const premiumSupabase = isPremiumBackendConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type EntitlementStatus = "active" | "expired" | "revoked" | "scheduled";

export interface PremiumEntitlement {
  id: string;
  product_code: string | null;
  kind: "premium" | "course_pass";
  course_id: string | null;
  status: EntitlementStatus;
  starts_at: string;
  ends_at: string;
}

export interface AccountData {
  userId: string;
  email: string | null;
  profile: {
    display_name: string;
    created_at: string;
    updated_at: string;
  } | null;
  entitlement: PremiumEntitlement | null;
  entitlements: PremiumEntitlement[];
  purchases: PremiumPurchase[];
}

export interface PremiumPurchase {
  purchaseNumber: string;
  productCode: string;
  productName: string;
  paymentMethod: "promotion" | "toss" | "bank_transfer" | "local";
  amount: number;
  currency: "KRW";
  status: "paid" | "refunded";
  purchasedAt: string;
}

export interface MarketplaceProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  kind: "premium" | "course_pass";
  courseId: string | null;
  courseCode: string | null;
  courseName: string | null;
  priceKrw: number;
  currency: "KRW";
  durationDays: number;
  maxAttempts: number | null;
  requiresPremium: boolean;
}

export interface PremiumCourse {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  entitlement_valid_until: string;
}

export interface PremiumProblemSetSummary {
  id: string;
  course_id: string;
  code: string;
  title: string;
  description: string;
  revision: number;
  question_type: PremiumQuestionType;
  question_count: number;
  attempt_count: number;
  sort_order: number;
}

export type PremiumQuestionType = "ox" | "multiple_choice" | "short_answer";

export interface PremiumQuestion {
  id: string;
  position: number;
  type: PremiumQuestionType;
  chapter: string;
  prompt: string;
  boxes: string[] | null;
  choices: string[] | null;
  source: string;
  points: number;
  answer?: string | null;
  answeredAt?: string | null;
  bookmarked?: boolean;
  wrongNote?: string;
  correctAnswer?: string | null;
  acceptedAnswers?: string[];
  explanation?: string;
}

export interface PremiumAttempt {
  id: string;
  problemSetId: string;
  courseId: string;
  title: string;
  sourceAttemptId: string | null;
  retryMode: "all" | "incorrect" | "unanswered" | "bookmarked" | null;
  orderMode: "number" | "chapter-random" | "random";
  status: "in_progress" | "paused" | "submitted";
  revision: number;
  elapsedSeconds: number;
  startedAt: string;
  questions: PremiumQuestion[];
}

export interface PremiumAttemptSummary {
  id: string;
  problemSetId: string;
  title: string;
  attemptNumber: number;
  status: "in_progress" | "paused" | "submitted";
  retryMode: "all" | "incorrect" | "unanswered" | "bookmarked" | null;
  orderMode: "number" | "chapter-random" | "random";
  questionType: PremiumQuestionType;
  totalQuestions: number;
  solvedQuestions: number;
  scorePercent: number | null;
  elapsedSeconds: number;
  createdAt: string;
}

export interface PremiumQuestionSolution {
  questionId: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
}

export interface PremiumResultQuestion extends PremiumQuestion {
  answer: string | null;
  isCorrect: boolean;
  earnedPoints: number;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
}

export interface PremiumAttemptResult {
  id: string;
  problemSetId: string;
  courseId: string;
  title: string;
  orderMode: "number" | "chapter-random" | "random";
  status: "submitted";
  revision: number;
  score: number;
  maxScore: number;
  elapsedSeconds: number;
  startedAt: string;
  submittedAt: string;
  questions: PremiumResultQuestion[];
}

export interface CloudBackupRecord {
  revision: number;
  dataModifiedAt: string;
  uploadedAt: string;
  subjectCount: number;
  sessionCount: number;
  questionCount: number;
  encryptedSizeBytes: number;
  backupFormatVersion: number;
  encryptionFormatVersion: number;
  deletionScheduledAt: string | null;
}

export interface CloudBackupMetadata {
  activePremium: boolean;
  backup: CloudBackupRecord | null;
  limits: {
    maxEncryptedBytes: number;
    dailyUploadLimit: number;
    dailyRestoreLimit: number;
    uploadsUsed: number;
    restoresUsed: number;
    resetsAt: string;
  };
  serverNow: string;
}

export interface CloudBackupUploadIntentInput {
  expectedRevision: number | null;
  dataModifiedAt: string;
  subjectCount: number;
  sessionCount: number;
  questionCount: number;
  encryptedSizeBytes: number;
  backupFormatVersion: number;
  encryptionFormatVersion: number;
}

export interface CloudBackupUploadIntent {
  uploadId: string;
  bucket: string;
  objectPath: string;
  token: string;
  contentType: string;
  expiresAt: string;
  uploadsUsed: number;
  uploadsRemaining: number;
  resetsAt: string;
}

export interface CloudBackupRestoreTicket {
  signedUrl: string;
  expiresAt: string;
  metadata: CloudBackupMetadata;
  restoresUsed: number;
  restoresRemaining: number;
  resetsAt: string;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; requestId?: string };
}

export class PremiumApiError extends Error {
  constructor(
    message: string,
    readonly code = "PREMIUM_API_ERROR",
    readonly status = 0,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "PremiumApiError";
  }
}

const hasMessage = (error: PremiumApiError, pattern: RegExp) =>
  pattern.test(error.message.toLowerCase());

/**
 * 서버와 인증 SDK의 기술적인 오류 문구가 화면에 그대로 노출되지 않도록
 * 안정적인 오류 코드와 HTTP 상태를 사용자 행동 중심의 안내로 변환합니다.
 */
export function getPremiumErrorMessage(
  cause: unknown,
  fallback = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
): string {
  if (!(cause instanceof PremiumApiError)) {
    if (cause instanceof TypeError) {
      return "서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.";
    }
    return fallback;
  }

  if (cause.code === "LOGIN_FAILED") {
    if (hasMessage(cause, /email not confirmed/)) {
      return "이메일 인증이 아직 완료되지 않았습니다. 인증 메일을 확인해 주세요.";
    }
    if (hasMessage(cause, /rate limit|too many requests/)) {
      return "로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    }
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }

  if (cause.code === "SIGNUP_FAILED") {
    if (hasMessage(cause, /already registered|already exists/)) {
      return "이미 가입된 이메일입니다. 로그인해 주세요.";
    }
    if (hasMessage(cause, /password|weak/)) {
      return "비밀번호는 8자 이상 입력해 주세요.";
    }
    if (hasMessage(cause, /email.*invalid|invalid.*email/)) {
      return "이메일 주소 형식을 확인해 주세요.";
    }
    if (hasMessage(cause, /rate limit|too many requests/)) {
      return "회원가입 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    }
    return "회원가입을 완료하지 못했습니다. 입력한 내용을 확인한 뒤 다시 시도해 주세요.";
  }

  const codeMessages: Record<string, string> = {
    AUTH_REQUIRED: "로그인이 필요합니다. 계정 페이지에서 로그인해 주세요.",
    AUTH_SESSION_ERROR: "로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요.",
    UNAUTHORIZED: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
    LOGOUT_FAILED: "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    FORBIDDEN: "이용 권한이 없습니다. Premium 회원권과 과목 이용권 상태를 확인해 주세요.",
    NOT_FOUND: "요청한 정보를 찾을 수 없습니다. 이전 화면으로 돌아가 다시 확인해 주세요.",
    ROUTE_NOT_FOUND: "요청한 기능을 찾을 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    INVALID_REQUEST: "요청한 내용을 확인한 뒤 다시 시도해 주세요.",
    INVALID_STATE: "현재 상태에서는 이 작업을 진행할 수 없습니다. 페이지를 새로고침해 주세요.",
    REVISION_CONFLICT: "다른 창에서 풀이 내용이 변경되었습니다. 페이지를 새로고침해 주세요.",
    CONFLICT: "이미 처리된 요청이거나 다른 작업과 겹쳤습니다. 최신 상태를 확인해 주세요.",
    ORDER_NOT_FOUND: "결제 정보를 찾을 수 없습니다. 구매 화면에서 다시 시도해 주세요.",
    PRODUCT_NOT_FOUND: "현재 구매할 수 없는 상품입니다. 상품 목록을 다시 확인해 주세요.",
    PAYMENT_NOT_CONFIGURED: "현재 결제를 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    LOCAL_PAYMENT_DISABLED: "현재 로컬 결제를 진행할 수 없습니다. 서버 설정을 확인해 주세요.",
    PAYMENT_KEY_REQUIRED: "결제 정보를 확인하지 못했습니다. 결제를 처음부터 다시 진행해 주세요.",
    PAYMENT_MISMATCH: "결제 정보가 일치하지 않습니다. 구매 화면에서 다시 시도해 주세요.",
    PAYMENT_CONFIRMATION_FAILED: "결제를 승인하지 못했습니다. 결제 상태를 확인한 뒤 다시 시도해 주세요.",
    PAYMENT_NOT_APPROVED: "결제가 승인되지 않았습니다. 결제 수단을 확인해 주세요.",
    ORDER_NOT_PAYABLE: "현재 결제할 수 없는 주문입니다. 구매 화면에서 다시 시도해 주세요.",
    PROVIDER_MISMATCH: "결제 수단 정보가 일치하지 않습니다. 결제를 처음부터 다시 진행해 주세요.",
    UNSUPPORTED_CURRENCY: "지원하지 않는 결제 통화입니다.",
    TOSS_FRONTEND_NOT_CONFIGURED: "현재 결제를 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    PROMOTION_CODE_INVALID: "프로모션 코드를 확인해 주세요.",
    PROMOTION_CODE_USED: "이미 사용된 프로모션 코드입니다.",
    PROMOTION_CODE_EXPIRED: "사용 기간이 지난 프로모션 코드입니다.",
    PROMOTION_PRODUCT_MISMATCH: "선택한 상품에 사용할 수 없는 프로모션 코드입니다.",
    PROMOTION_CODE_DISABLED: "현재 사용할 수 없는 프로모션 코드입니다.",
    ATTEMPT_LIMIT_REACHED: "이 이용권에서 시작할 수 있는 풀이 횟수를 모두 사용했습니다.",
    PREMIUM_REQUIRED: "클라우드 백업은 Premium 이용 기간에만 백업·복구할 수 있습니다.",
    BACKUP_DAILY_LIMIT: "오늘 사용할 수 있는 클라우드 백업 횟수를 모두 사용했습니다. 내일 다시 이용해 주세요.",
    BACKUP_CONFLICT: "다른 기기에서 클라우드 백업이 변경되었습니다. 최신 정보를 확인해 주세요.",
    BACKUP_UPLOAD_INVALID: "백업 업로드 시간이 지났거나 파일을 확인하지 못했습니다. 다시 시도해 주세요.",
    BACKUP_NOT_FOUND: "저장된 클라우드 백업이 없습니다.",
    BACKUP_STORAGE_CAPACITY: "클라우드 백업 저장 공간이 부족합니다. 잠시 후 다시 시도해 주세요.",
    BACKUP_STORAGE_ERROR: "클라우드 백업 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    PREMIUM_NOT_CONFIGURED: "Premium 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    DATABASE_ERROR: "서비스가 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
    INTERNAL_ERROR: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    EMPTY_RPC_RESULT: "처리 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    METHOD_NOT_ALLOWED: "요청을 처리할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    UNSUPPORTED_MEDIA_TYPE: "요청 형식을 확인하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    ORIGIN_NOT_ALLOWED: "현재 접속한 주소에서는 Premium 기능을 이용할 수 없습니다.",
    PAYLOAD_TOO_LARGE: "요청 내용의 크기가 너무 큽니다. 입력 내용을 줄인 뒤 다시 시도해 주세요.",
    INVALID_JSON: "요청 형식을 확인하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
  };
  const mappedMessage = codeMessages[cause.code];
  if (mappedMessage) return mappedMessage;

  if (cause.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  if (cause.status === 403) {
    return "이용 권한이 없습니다. Premium 회원권과 과목 이용권 상태를 확인해 주세요.";
  }
  if (cause.status === 404) {
    return "요청한 정보를 찾을 수 없습니다. 이전 화면으로 돌아가 다시 확인해 주세요.";
  }
  if (cause.status === 409) {
    return "다른 작업과 겹쳐 처리하지 못했습니다. 최신 상태를 확인한 뒤 다시 시도해 주세요.";
  }
  if (cause.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  if (cause.status >= 500) return "서비스가 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.";
  return fallback;
}

function requireClient() {
  if (!premiumSupabase) {
    throw new PremiumApiError(
      "로컬 Premium 서버 설정이 없습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 확인해 주세요.",
      "PREMIUM_NOT_CONFIGURED",
    );
  }
  return premiumSupabase;
}

let sessionRefresh: Promise<Session> | null = null;

function shouldRefreshSession(session: Session): boolean {
  if (typeof session.expires_at !== "number") return false;
  return session.expires_at <= Math.floor(Date.now() / 1000) + SESSION_REFRESH_LEEWAY_SECONDS;
}

async function refreshCurrentSession(): Promise<Session> {
  if (sessionRefresh) return sessionRefresh;

  sessionRefresh = (async () => {
    const { data, error } = await requireClient().auth.refreshSession();
    if (error) {
      throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR", error.status ?? 401);
    }
    if (!data.session) {
      throw new PremiumApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
    }
    return data.session;
  })();

  try {
    return await sessionRefresh;
  } finally {
    sessionRefresh = null;
  }
}

async function currentSession(): Promise<Session | null> {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR");
  if (!data.session) return null;
  return shouldRefreshSession(data.session) ? refreshCurrentSession() : data.session;
}

async function accessToken(forceRefresh = false) {
  const session = forceRefresh ? await refreshCurrentSession() : await currentSession();
  if (!session) throw new PremiumApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
  return session.access_token;
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

async function apiRequest<T>(
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

  const payload = await response.json().catch(() => null) as ({ data?: T } & ApiErrorBody) | null;
  if (!response.ok) {
    throw new PremiumApiError(
      payload?.error?.message ?? "Premium 서버 요청을 처리하지 못했습니다.",
      payload?.error?.code,
      response.status,
      payload?.error?.requestId,
    );
  }
  if (!payload || !("data" in payload)) {
    throw new PremiumApiError("Premium 서버 응답 형식이 올바르지 않습니다.");
  }
  return payload.data as T;
}

async function publicApiRequest<T>(functionName: string): Promise<T> {
  if (!isPremiumBackendConfigured) {
    throw new PremiumApiError("Premium 서버 설정이 없습니다.", "PREMIUM_NOT_CONFIGURED");
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    headers: { apikey: publishableKey },
  });
  const payload = await response.json().catch(() => null) as ({ data?: T } & ApiErrorBody) | null;
  if (!response.ok) {
    throw new PremiumApiError(
      payload?.error?.message ?? "상품 정보를 불러오지 못했습니다.",
      payload?.error?.code,
      response.status,
      payload?.error?.requestId,
    );
  }
  if (!payload || !("data" in payload)) {
    throw new PremiumApiError("상품 서버 응답 형식이 올바르지 않습니다.");
  }
  return payload.data as T;
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName.trim() || "학습자" } },
  });
  if (error) throw new PremiumApiError(error.message, "SIGNUP_FAILED");
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw new PremiumApiError(error.message, "LOGIN_FAILED");
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw new PremiumApiError(error.message, "LOGOUT_FAILED");
}

export async function getCurrentSession() {
  if (!premiumSupabase) return null;
  return currentSession();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!premiumSupabase) return () => undefined;
  const { data } = premiumSupabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export const getAccount = () => apiRequest<AccountData>("account-api");

export const listMarketplaceProducts = () =>
  publicApiRequest<MarketplaceProduct[]>("marketplace-api");

export async function purchaseProduct(productCode: string) {
  const checkout = await apiRequest<{
    order: {
      checkoutOrderId: string;
      orderId: string;
      amount: number;
      currency: string;
      status: string;
    };
    payment: { provider: "local" | "toss"; clientKey?: string };
  }>("checkout", "", {
    method: "POST",
    body: JSON.stringify({ productCode, idempotencyKey: `web-${createId()}` }),
  });

  if (checkout.payment.provider !== "local") {
    throw new PremiumApiError(
      "현재 프론트 연동 테스트는 로컬 결제만 지원합니다. Toss 결제창 연동은 운영 키 설정 후 진행해 주세요.",
      "TOSS_FRONTEND_NOT_CONFIGURED",
    );
  }

  return apiRequest<{ order: { status: string } }>("confirm-payment", "", {
    method: "POST",
    body: JSON.stringify({
      checkoutOrderId: checkout.order.checkoutOrderId,
      orderId: checkout.order.orderId,
      amount: checkout.order.amount,
    }),
  });
}

export const redeemPromotionCode = (productCode: string, promotionCode: string) =>
  apiRequest<{ order: { status: string; purchaseNumber?: string }; paymentMethod: "promotion" }>(
    "promotion-api",
    "",
    {
      method: "POST",
      body: JSON.stringify({ productCode, promotionCode }),
    },
  );

export const listPremiumCourses = () =>
  apiRequest<PremiumCourse[]>("learning-api", "/courses");

export const listPremiumProblemSets = (courseId: string) =>
  apiRequest<PremiumProblemSetSummary[]>(
    "learning-api",
    `/courses/${encodeURIComponent(courseId)}/problem-sets`,
  );

export const listPremiumProblemSetAttempts = (problemSetId: string) =>
  apiRequest<PremiumAttemptSummary[]>(
    "learning-api",
    `/problem-sets/${encodeURIComponent(problemSetId)}/attempts`,
  );

export const createPremiumAttempt = (problemSetId: string) =>
  apiRequest<PremiumAttempt>("learning-api", "/attempts", {
    method: "POST",
    body: JSON.stringify({ problemSetId, idempotencyKey: `web-attempt-${createId()}` }),
  });

export const getPremiumAttempt = (attemptId: string) =>
  apiRequest<PremiumAttempt>("learning-api", `/attempts/${encodeURIComponent(attemptId)}`);

export const getPremiumQuestionSolution = (attemptId: string, questionId: string) =>
  apiRequest<PremiumQuestionSolution>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/solutions/${encodeURIComponent(questionId)}`,
  );

export const savePremiumAnswer = (
  attemptId: string,
  questionId: string,
  answer: string | null,
  expectedRevision: number,
) => apiRequest<PremiumAttempt>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ answer, expectedRevision }),
  },
);

export const setPremiumBookmark = (
  attemptId: string,
  questionId: string,
  bookmarked: boolean,
  expectedRevision: number,
) => apiRequest<PremiumAttempt>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/bookmarks/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ bookmarked, expectedRevision }),
  },
);

export const pausePremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/pause`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const resumePremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/resume`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const submitPremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttemptResult>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const getPremiumResult = (attemptId: string) =>
  apiRequest<PremiumAttemptResult>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/result`,
  );

export const retryPremiumAttempt = (
  attemptId: string,
  mode: "all" | "incorrect" | "bookmarked",
  title: string,
  orderMode: "number" | "chapter-random" | "random",
) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/retry`,
    {
      method: "POST",
      body: JSON.stringify({
        mode,
        title,
        orderMode,
        idempotencyKey: `web-retry-${createId()}`,
      }),
    },
  );

export const savePremiumWrongNote = (
  attemptId: string,
  questionId: string,
  note: string,
  expectedRevision: number,
) => apiRequest<PremiumAttemptResult>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/notes/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ note, expectedRevision }),
  },
);

export const getCloudBackupMetadata = () =>
  apiRequest<CloudBackupMetadata>("backup-api");

export const createCloudBackupUploadIntent = (input: CloudBackupUploadIntentInput) =>
  apiRequest<CloudBackupUploadIntent>("backup-api", "/upload-intents", {
    method: "POST",
    body: JSON.stringify(input),
  });

export async function uploadCloudBackupObject(
  intent: CloudBackupUploadIntent,
  encryptedBackup: Uint8Array,
): Promise<void> {
  const { error } = await requireClient().storage.from(intent.bucket).uploadToSignedUrl(
    intent.objectPath,
    intent.token,
    new Blob([
      encryptedBackup.buffer.slice(
        encryptedBackup.byteOffset,
        encryptedBackup.byteOffset + encryptedBackup.byteLength,
      ) as ArrayBuffer,
    ], { type: intent.contentType }),
    { contentType: intent.contentType, cacheControl: "0", upsert: false },
  );
  if (error) {
    throw new PremiumApiError(
      "암호화된 백업 파일을 업로드하지 못했습니다.",
      "BACKUP_STORAGE_ERROR",
      0,
    );
  }
}

export const commitCloudBackupUpload = (uploadId: string) =>
  apiRequest<CloudBackupMetadata>(
    "backup-api",
    `/upload-intents/${encodeURIComponent(uploadId)}/commit`,
    { method: "POST" },
  );

export const createCloudBackupRestoreTicket = () =>
  apiRequest<CloudBackupRestoreTicket>("backup-api", "/restore", { method: "POST" });

function browserStorageUrl(signedUrl: string): string {
  const target = new URL(signedUrl);
  const configuredApi = new URL(supabaseUrl);
  const isLocalApi = configuredApi.hostname === "127.0.0.1" || configuredApi.hostname === "localhost";
  if (isLocalApi && (target.hostname === "kong" || target.port === "8000")) {
    target.protocol = configuredApi.protocol;
    target.host = configuredApi.host;
  }
  return target.toString();
}

export async function downloadCloudBackupObject(ticket: CloudBackupRestoreTicket) {
  const expectedSize = ticket.metadata.backup?.encryptedSizeBytes;
  const response = await fetch(browserStorageUrl(ticket.signedUrl), { cache: "no-store" });
  if (!response.ok) {
    throw new PremiumApiError(
      "암호화된 백업 파일을 내려받지 못했습니다.",
      "BACKUP_STORAGE_ERROR",
      response.status,
    );
  }
  const declaredSize = Number(response.headers.get("content-length") ?? "0");
  if (declaredSize > 15_000_000) {
    throw new PremiumApiError("백업 파일 크기를 확인할 수 없습니다.", "BACKUP_UPLOAD_INVALID", 409);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 1 || bytes.byteLength > 15_000_000 || bytes.byteLength !== expectedSize) {
    throw new PremiumApiError("백업 파일 크기가 일치하지 않습니다.", "BACKUP_UPLOAD_INVALID", 409);
  }
  return bytes;
}

export const deleteCloudBackup = () =>
  apiRequest<{ deleted: true }>("backup-api", "", { method: "DELETE" });
