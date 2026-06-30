import { DEFAULT_BASE_URL } from "./types";

/**
 * Tracks in-flight / completed script loads per baseUrl so the `sentinel.js`
 * script is only ever injected ONCE, even with many widgets on a page.
 */
const loaders = new Map<string, Promise<void>>();

/** Build the script URL for a given base URL (trailing slashes trimmed). */
function scriptUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/sentinel.js`;
}

/**
 * Inject the Sentinel widget script once. Subsequent calls (same baseUrl)
 * resolve against the same promise. Resolves once the script has loaded.
 */
export function loadSentinelScript(baseUrl: string = DEFAULT_BASE_URL): Promise<void> {
  // SSR / non-browser guard — nothing to load.
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const src = scriptUrl(baseUrl);

  const existing = loaders.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    // The script may already be on the page (e.g. injected manually).
    const prior = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (prior) {
      if (prior.dataset.sentinelLoaded === "true") {
        resolve();
      } else {
        prior.addEventListener("load", () => resolve(), { once: true });
        prior.addEventListener(
          "error",
          () => reject(new Error(`Failed to load Sentinel script: ${src}`)),
          { once: true }
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.sentinelLoaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        // Allow a future retry by clearing the cached (failed) promise.
        loaders.delete(src);
        reject(new Error(`Failed to load Sentinel script: ${src}`));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  loaders.set(src, promise);
  return promise;
}
