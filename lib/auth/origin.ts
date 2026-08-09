interface RequestOriginInput {
  forwardedHost?: string | null;
  host?: string | null;
  forwardedProtocol?: string | null;
  configuredUrl?: string | null;
}

function firstForwardedValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? "";
}

function normalizeHost(value: string | null | undefined) {
  const host = firstForwardedValue(value);

  if (!host || /[\s/\\]/.test(host)) return "";

  return host;
}

function configuredOrigin(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

export function resolveRequestOrigin({
  forwardedHost,
  host,
  forwardedProtocol,
  configuredUrl,
}: RequestOriginInput) {
  const requestHost = normalizeHost(forwardedHost) || normalizeHost(host);

  if (requestHost) {
    const protocol = firstForwardedValue(forwardedProtocol) === "http" ? "http" : "https";
    return `${protocol}://${requestHost}`;
  }

  return configuredOrigin(configuredUrl) || "http://localhost:3000";
}
