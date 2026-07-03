# @redeyed_/sentinel-nextjs

Next.js bindings for the **Redeyed Sentinel** CAPTCHA: a `"use client"`
component for rendering the widget plus a server-side `verifySentinel()` helper
for Route Handlers / Server Actions / API routes. **Free to use** — you just
need a free **site key + secret key** from **Redeyed Lab → Sentinel → Sites**.

## Install

```bash
npm i @redeyed_/sentinel-nextjs
```

> Ships TypeScript/TSX source under `src/`; Next.js transpiles it for you.
> The client component and the server helper are split via the package
> `exports` map so your **secret key never bundles into client code**.

Both keys come from **Redeyed Lab → Sentinel → Sites**. The **Secret Key** is
shown **once** when you create the site — copy it then and keep it server-side.

Set your environment variables:

```dotenv
# .env.local
NEXT_PUBLIC_SENTINEL_SITE_KEY=pk_your_site_key      # public — safe in the browser
SENTINEL_SECRET_KEY=sk_your_secret_key              # SECRET — server only
```

## Client: render the widget

```tsx
"use client";

import { useState } from "react";
import { SentinelCaptcha } from "@redeyed_/sentinel-nextjs";
import { signup } from "./actions";

export function SignupForm() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <form action={signup}>
      {/* keep the token in a hidden field so the Server Action receives it */}
      <input type="hidden" name="sentinel-token" value={token ?? ""} />
      {/* ...your fields... */}

      <SentinelCaptcha
        siteKey={process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!}
        onVerify={setToken}
        onError={(err) => console.error(err)}
      />

      <button type="submit" disabled={!token}>
        Sign up
      </button>
    </form>
  );
}
```

## Server: verify the token (Server Action)

```ts
// app/actions.ts
"use server";

import { verifySentinel } from "@redeyed_/sentinel-nextjs/server";

export async function signup(formData: FormData) {
  const token = String(formData.get("sentinel-token") ?? "");

  const passed = await verifySentinel(token, {
    siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
    secretKey: process.env.SENTINEL_SECRET_KEY!, // secret — server only
  });

  if (!passed) {
    throw new Error("CAPTCHA verification failed");
  }

  // ...create the account
}
```

### Or in a Route Handler

```ts
// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { verifySentinel } from "@redeyed_/sentinel-nextjs/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const passed = await verifySentinel(token, {
    siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
    secretKey: process.env.SENTINEL_SECRET_KEY!,
    // Optional: forward the caller IP for extra signal.
    remoteip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  if (!passed) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
```

## API

### `<SentinelCaptcha />`

| Prop        | Type                      | Required | Description                                                    |
| ----------- | ------------------------- | :------: | -------------------------------------------------------------- |
| `siteKey`   | `string`                  |    yes   | Public site key. If missing, renders nothing + `console.warn`. |
| `onVerify`  | `(token: string) => void` |    no    | Called with the token once solved.                             |
| `onError`   | `(error: Error) => void`  |    no    | Called if the Sentinel script fails to load.                   |
| `widget`    | `string`                  |    no    | Widget variant (`data-widget`).                                |
| `theme`     | `string`                  |    no    | Theme name (`data-theme`).                                     |
| `scheme`    | `string`                  |    no    | Color scheme (`data-scheme`).                                  |
| `difficulty`| `string \| number`        |    no    | Challenge strength: `easy`/`medium`/`hard`/`max` or `1`-`6` (`data-difficulty`). |
| `baseUrl`   | `string`                  |    no    | Asset/script base URL. Defaults to `https://redeyed.com`.      |
| `className` | `string`                  |    no    | Extra class on the container.                                  |

### `verifySentinel(token, { siteKey, secretKey, remoteip?, baseUrl? }) => Promise<boolean>`

POSTs to `{baseUrl}/sentinel/siteverify`, reCAPTCHA/Turnstile-style, with a JSON
body of `{ secret, response, remoteip? }`. Returns `true` only when the response
JSON has `success === true`; any network/HTTP/parse failure returns `false`
(fail-closed). If **no** `secretKey` is configured it **fails open** (returns
`true`) so unconfigured dev/preview environments aren't hard-blocked. **Import
from `@redeyed_/sentinel-nextjs/server` only — never from client code.**

#### How it works

1. The client widget solves the challenge and hands you a **token**.
2. You POST that token to `{baseUrl}/sentinel/siteverify` as `response`, along
   with your **secret key** as `secret` (and optionally the caller's `remoteip`).
3. Sentinel replies with `{ success, outcome, score }`; the request passes when
   `success === true`.

The public **site key** stays in the browser (widget); the **secret key** never
leaves your server. Both are issued in Redeyed Lab → Sentinel → Sites.

## Changelog

### 1.0.1

- **Server verify migrated to the reCAPTCHA/Turnstile-style secret-key flow.**
  `verifySentinel()` now POSTs `{ secret, response, remoteip? }` to
  `{baseUrl}/sentinel/siteverify` (was `X-Api-Key` + `{ site_key, token }` to
  `/api/v1/verify`) and passes on top-level `success === true`.
- Renamed the option `apiKey` → `secretKey` and the env var
  `SENTINEL_API_KEY` → `SENTINEL_SECRET_KEY`; added an optional `remoteip`.
- Now **fails open** when no secret key is configured.

## License

MIT © 2026 Redeyed Corporation
