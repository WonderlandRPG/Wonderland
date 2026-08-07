export function getSafeRedirectPath(value: string | null | undefined, fallback = "/perfil") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://wonderland.local");

    if (url.origin !== "https://wonderland.local") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
