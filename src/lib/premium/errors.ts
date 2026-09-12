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
    LOCAL_PAYMENT_DISABLED: "현재 결제를 진행할 수 없습니다. 이용권 화면에서 사용 가능한 방법을 확인해 주세요.",
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
    PREMIUM_REQUIRED: "클라우드 백업과 복구는 Premium 이용 기간에 사용할 수 있습니다.",
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

