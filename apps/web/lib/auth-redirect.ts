export const DEFAULT_AUTH_REDIRECT = "/dashboard"

export function getAuthRedirectUri(
  fallback: string = DEFAULT_AUTH_REDIRECT,
): string {
  if (typeof window === "undefined") return fallback

  const raw = new URLSearchParams(window.location.search).get("redirectTo")
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback

  return raw
}