import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { createId } from "./id";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

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
  question_types: PremiumQuestionType[];
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

async function accessToken() {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR");
  if (!data.session) throw new PremiumApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
  return data.session.access_token;
}

async function apiRequest<T>(
  functionName: string,
  path = "",
  init: RequestInit = {},
): Promise<T> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("apikey", publishableKey);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}${path}`, {
    ...init,
    headers,
  });
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
  const { data, error } = await premiumSupabase.auth.getSession();
  if (error) throw new PremiumApiError(error.message, "AUTH_SESSION_ERROR");
  return data.session;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!premiumSupabase) return () => undefined;
  const { data } = premiumSupabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export const getAccount = () => apiRequest<AccountData>("account-api");

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
