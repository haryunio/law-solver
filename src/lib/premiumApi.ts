// Public entry point for Premium UI and stores. Keep transport and credentials internal.
export type * from "./premium/types";
export { isPremiumBackendConfigured, premiumSupabase } from "./premium/client";
export { PremiumApiError, getPremiumErrorMessage } from "./premium/errors";
export { signUp, signIn, signOut, getCurrentSession, onAuthStateChange } from "./premium/auth";
export * from "./premium/account";
export * from "./premium/learning";
export * from "./premium/backup";
