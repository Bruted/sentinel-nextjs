/**
 * Shared types for the Redeyed Sentinel CAPTCHA Next.js bindings.
 */

/** Default Redeyed base URL. Override via `baseUrl` for self-hosted / staging. */
export const DEFAULT_BASE_URL = "https://redeyed.com";

/**
 * The `event.detail` payload dispatched by the Sentinel widget on the
 * bubbling `sentinel:solved` CustomEvent.
 */
export interface SentinelSolvedDetail {
  /** The verification token to send to YOUR server for verification. */
  token: string;
}

export interface SentinelCaptchaProps {
  /**
   * Your public Sentinel site key. REQUIRED.
   * Get one (free) at https://redeyed.com/developers.
   * Safe to expose in the browser (use NEXT_PUBLIC_SENTINEL_SITE_KEY).
   * If omitted, the component renders nothing and logs a console warning.
   */
  siteKey: string;

  /** Optional widget variant (maps to `data-widget` on the container div). */
  widget?: string;

  /** Optional theme name (maps to `data-theme`). */
  theme?: string;

  /** Optional color scheme, e.g. "light" | "dark" (maps to `data-scheme`). */
  scheme?: string;

  /** Base URL for the Sentinel script + assets. Defaults to https://redeyed.com. */
  baseUrl?: string;

  /**
   * Called with the verification token once the user solves the challenge.
   * Send this token to a Server Action / Route Handler and verify it there.
   */
  onVerify?: (token: string) => void;

  /** Called if the Sentinel script fails to load. */
  onError?: (error: Error) => void;

  /** Optional className applied to the container div (alongside `sentinel-captcha`). */
  className?: string;
}

/** Options for the server-side {@link verifySentinel} helper. */
export interface VerifySentinelOptions {
  /** Public site key (NEXT_PUBLIC_SENTINEL_SITE_KEY). */
  siteKey: string;
  /** Secret API key — SERVER-SIDE ONLY (SENTINEL_API_KEY). Never expose this. */
  apiKey: string;
  /** Override the API base URL. Defaults to https://redeyed.com. */
  baseUrl?: string;
}
