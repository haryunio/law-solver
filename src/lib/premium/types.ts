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

