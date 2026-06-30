# @redeyed/sentinel-nextjs

Next.js bindings for the **Redeyed Sentinel** CAPTCHA: a `"use client"`
component for rendering the widget plus a server-side `verifySentinel()` helper
for Route Handlers / Server Actions / API routes. **Free to use** — you just
need a free site key + API key from **<https://redeyed.com/developers>**.

## Install

```bash
npm i @redeyed/sentinel-nextjs
```

> Ships TypeScript/TSX source under `src/`; Next.js transpiles it for you.
> The client component and the server helper are split via the package
> `exports` map so your **secret API key never bundles into client code**.

Set your environment variables:

```dotenv
# .env.local
NEXT_PUBLIC_SENTINEL_SITE_KEY=pk_your_site_key   # public — safe in the browser
SENTINEL_API_KEY=sk_your_secret_api_key          # SECRET — server only
```

## Client: render the widget

```tsx
"use client";

import { useState } from "react";
import { SentinelCaptcha } from "@redeyed/sentinel-nextjs";
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

import { verifySentinel } from "@redeyed/sentinel-nextjs/server";

export async function signup(formData: FormData) {
  const token = String(formData.get("sentinel-token") ?? "");

  const passed = await verifySentinel(token, {
    siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
    apiKey: process.env.SENTINEL_API_KEY!, // secret — server only
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
import { verifySentinel } from "@redeyed/sentinel-nextjs/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const passed = await verifySentinel(token, {
    siteKey: process.env.NEXT_PUBLIC_SENTINEL_SITE_KEY!,
    apiKey: process.env.SENTINEL_API_KEY!,
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
| `baseUrl`   | `string`                  |    no    | Asset/script base URL. Defaults to `https://redeyed.com`.      |
| `className` | `string`                  |    no    | Extra class on the container.                                  |

### `verifySentinel(token, { siteKey, apiKey, baseUrl? }) => Promise<boolean>`

POSTs to `{baseUrl}/api/v1/verify`. Returns `true` only when the response JSON
has `data.success === true` (or top-level `success === true`); any failure
returns `false` (fail-closed). **Import from `@redeyed/sentinel-nextjs/server`
only — never from client code.**

## License

MIT © 2026 Redeyed Corporation
