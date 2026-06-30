"use client";

import { useEffect, useRef } from "react";
import { loadSentinelScript } from "./loadSentinelScript";
import {
  DEFAULT_BASE_URL,
  type SentinelCaptchaProps,
  type SentinelSolvedDetail,
} from "./types";

/**
 * <SentinelCaptcha /> — Next.js ("use client") component that renders the
 * Redeyed Sentinel CAPTCHA widget.
 *
 * The widget script (`{baseUrl}/sentinel.js`) is injected once per page, then
 * Sentinel hydrates the `.sentinel-captcha` div. When the user solves the
 * challenge, the widget injects a hidden `sentinel-token` input AND dispatches
 * a bubbling `sentinel:solved` CustomEvent carrying the token.
 *
 * Pass the token from `onVerify` to a Server Action / Route Handler and verify
 * it there with `verifySentinel` (from "@redeyed/sentinel-nextjs/server").
 * Your secret API key must NEVER reach the browser.
 *
 * @example
 * <SentinelCaptcha
 *   siteKey={process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!}
 *   onVerify={(token) => setToken(token)}
 * />
 */
export function SentinelCaptcha(props: SentinelCaptchaProps) {
  const {
    siteKey,
    widget,
    theme,
    scheme,
    baseUrl = DEFAULT_BASE_URL,
    onVerify,
    onError,
    className,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep latest callbacks in refs so the effect doesn't re-run (and re-inject
  // the widget) when a parent re-renders with new function identities.
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    const handleSolved = (event: Event) => {
      const detail = (event as CustomEvent<SentinelSolvedDetail>).detail;
      const token =
        detail?.token ??
        container.querySelector<HTMLInputElement>(
          'input[name="sentinel-token"]'
        )?.value ??
        "";

      if (token) {
        onVerifyRef.current?.(token);
      }
    };

    container.addEventListener("sentinel:solved", handleSolved as EventListener);

    loadSentinelScript(baseUrl).catch((err: unknown) => {
      if (cancelled) return;
      onErrorRef.current?.(
        err instanceof Error ? err : new Error(String(err))
      );
    });

    return () => {
      cancelled = true;
      container.removeEventListener(
        "sentinel:solved",
        handleSolved as EventListener
      );
    };
  }, [siteKey, widget, theme, scheme, baseUrl]);

  // Required prop guard: render nothing + warn.
  if (!siteKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "[@redeyed/sentinel-nextjs] `siteKey` is required — rendering nothing. " +
        "Get a free key at https://redeyed.com/developers"
    );
    return null;
  }

  const classes = className
    ? `sentinel-captcha ${className}`
    : "sentinel-captcha";

  return (
    <div
      ref={containerRef}
      className={classes}
      data-sitekey={siteKey}
      {...(widget ? { "data-widget": widget } : {})}
      {...(theme ? { "data-theme": theme } : {})}
      {...(scheme ? { "data-scheme": scheme } : {})}
    />
  );
}

export default SentinelCaptcha;
