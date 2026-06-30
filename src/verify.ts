/**
 * Server-side Sentinel verification helper.
 *
 * SERVER-SIDE ONLY. This module reads your secret API key and must never be
 * imported into client ("use client") code. Import it from a Server Action,
 * Route Handler, or API route:
 *
 *   import { verifySentinel } from "@redeyed/sentinel-nextjs/server";
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
 * Verify a Sentinel token against the Redeyed API.
 *
 * POSTs to `{baseUrl}/api/v1/verify` with `X-Api-Key` and the site key + token.
 * Returns `true` only when the response JSON has `data.success === true`
 * (or top-level `success === true`). Any network/HTTP/parse failure returns
 * `false` (fail-closed) — inspect logs if you need to distinguish causes.
 *
 * @example
 * "use server";
 * import { verifySentinel } from "@redeyed/sentinel-nextjs/server";
 *
 * export async function submit(formData: FormData) {
 *   const ok = await verifySentinel(String(formData.get("sentinel-token")), {
 *     siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
 *     apiKey: process.env.SENTINEL_API_KEY!,
 *   });
 *   if (!ok) throw new Error("CAPTCHA verification failed");
 *   // ...proceed
 * }
 */
export async function verifySentinel(
  token: string,
  options: VerifySentinelOptions
): Promise<boolean> {
  const { siteKey, apiKey, baseUrl = DEFAULT_BASE_URL } = options;

  if (!token || !siteKey || !apiKey) {
    return false;
  }

  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/verify`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ site_key: siteKey, token }),
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

/** Narrow the API response to the PASSED contract. */
function isSuccessful(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const body = payload as {
    success?: unknown;
    data?: { success?: unknown } | null;
  };

  if (body.data && typeof body.data === "object") {
    if (body.data.success === true) {
      return true;
    }
  }

  return body.success === true;
}

export type { VerifySentinelOptions } from "./types";
