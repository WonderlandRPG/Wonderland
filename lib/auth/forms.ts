export type AuthField = "displayName" | "email" | "password" | "confirmPassword" | "acceptedTerms";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
}

export const idleAuthState: AuthActionState = { status: "idle" };
