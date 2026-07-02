/**
 * Server-side Sentinel verification helper.
 *
 * SERVER-SIDE ONLY. This module reads your secret key and must never be
 * imported into client ("use client") code. Import it from a Server Action,
 * Route Handler, or API route:
 *
 *   import { verifySentinel } from "@redeyed_/sentinel-nextjs/server";
 *
 * It intentionally has NO "use client" directive and no React imports so it
 * stays out of the client bundle.
 */

import { DEFAULT_BASE_URL, type VerifySentinelOptions } from "./types";

/** Trim trailing slashes from a base URL. */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Verify a Sentinel token against the Redeyed siteverify endpoint.
 *
 * POSTs to `{baseUrl}/sentinel/siteverify` with the secret key and the token,
 * reCAPTCHA/Turnstile-style. Returns `true` only when the response JSON has
 * `success === true`. Any network/HTTP/parse failure returns `false`
 * (fail-closed) — inspect logs if you need to distinguish causes.
 *
 * Fails **open** (returns `true`) when no secret key is configured, so local
 * dev / preview environments without a key are not hard-blocked.
 *
 * @example
 * "use server";
 * import { verifySentinel } from "@redeyed_/sentinel-nextjs/server";
 *
 * export async function submit(formData: FormData) {
 *   const ok = await verifySentinel(String(formData.get("sentinel-token")), {
 *     siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
 *     secretKey: process.env.SENTINEL_SECRET_KEY!,
 *   });
 *   if (!ok) throw new Error("CAPTCHA verification failed");
 *   // ...proceed
 * }
 */
export async function verifySentinel(
  token: string,
  options: VerifySentinelOptions
): Promise<boolean> {
  const { secretKey, remoteip, baseUrl = DEFAULT_BASE_URL } = options;

  // Fail open when unconfigured: no secret means Sentinel isn't set up yet.
  if (!secretKey) {
    return true;
  }

  if (!token) {
    return false;
  }

  const url = `${normalizeBaseUrl(baseUrl)}/sentinel/siteverify`;

  const body: { secret: string; response: string; remoteip?: string } = {
    secret: secretKey,
    response: token,
  };
  if (remoteip) {
    body.remoteip = remoteip;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      // Verification must never be cached.
      cache: "no-store",
    });
  } catch {
    return false;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return false;
  }

  return isSuccessful(payload);
}

/** Narrow the siteverify response to the PASSED contract. */
function isSuccessful(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return (payload as { success?: unknown }).success === true;
}

export type { VerifySentinelOptions } from "./types";
