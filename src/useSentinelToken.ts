"use client";

import { useEffect, useState } from "react";
import type { SentinelSolvedDetail } from "./types";

/**
 * useSentinelToken — subscribe to the latest Sentinel token solved anywhere on
 * the page (listens for the bubbling `sentinel:solved` event on `document`).
 *
 * @param target Optional element to scope the listener to. Defaults to `document`.
 * @returns the most recent verification token, or `null` until one is solved.
 */
export function useSentinelToken(
  target?: HTMLElement | Document | null
): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const node: HTMLElement | Document = target ?? document;

    const handleSolved = (event: Event) => {
      const detail = (event as CustomEvent<SentinelSolvedDetail>).detail;
      if (detail?.token) {
        setToken(detail.token);
      }
    };

    node.addEventListener("sentinel:solved", handleSolved as EventListener);
    return () => {
      node.removeEventListener("sentinel:solved", handleSolved as EventListener);
    };
  }, [target]);

  return token;
}
