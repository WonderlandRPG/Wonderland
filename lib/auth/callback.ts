const callbackParameterNames = ["code", "token_hash", "type", "next", "sb_flow_id"] as const;

export const recoveryIntentCookieName = "wonderland-recovery-pending";

export interface AuthCallbackParameters {
  code?: string;
  token_hash?: string;
  type?: string;
  next?: string;
  sb_flow_id?: string;
}

export function getAuthCallbackPath(parameters: AuthCallbackParameters) {
  if (!parameters.code && !parameters.token_hash) return null;

  const query = new URLSearchParams();

  callbackParameterNames.forEach((name) => {
    const value = parameters[name];

    if (value) query.set(name, value);
  });

  if (parameters.type === "recovery" && !parameters.next) {
    query.set("next", "/nova-senha");
  }

  return `/auth/callback?${query.toString()}`;
}
