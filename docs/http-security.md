# Prompt 38 — HTTP and Cookie Mutation Security

Prompt 38 adds a defense-in-depth HTTP security baseline without introducing a restrictive script/connect CSP that could silently break Next.js, realtime, map providers, payment redirects, or Vercel tooling.

## Cookie-authenticated mutation CSRF boundary

Every authenticated API call that passes through `requireAuth()` now calls `assertSafeMutationOrigin()`.

- `GET`, `HEAD`, and `OPTIONS` are treated as safe methods.
- Bearer-token calls are allowed without browser Origin checks because bearer credentials are explicit rather than ambient cookies. This preserves native/mobile/server-to-server clients.
- State-changing requests that use `karaan_session` must come from the exact requested KarAan origin.
- `Sec-Fetch-Site: cross-site` is rejected.
- `Origin` is preferred; a same-origin `Referer` is accepted as fallback.
- A cookie-authenticated mutation with neither a valid Origin nor Referer is rejected with `403`.
- `X-Forwarded-Proto` and `X-Forwarded-Host` are respected so the check works correctly behind Vercel/reverse proxies.

This complements the existing `SameSite=Lax` cookie rather than replacing it.

## Response security headers

All routes receive:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: off`
- `X-Permitted-Cross-Domain-Policies: none`
- `Permissions-Policy` that keeps geolocation available only to self while disabling camera/microphone
- a deliberately minimal CSP: `base-uri 'self'; object-src 'none'; frame-ancestors 'none'`
- HSTS for HTTPS production origins

The CSP intentionally does not define `script-src`, `connect-src`, `style-src`, or `img-src` in this prompt. Tightening those directives requires an inventory/nonces strategy and must not be guessed in production.

## Cache and indexing boundaries

- `/api/*` receives `Cache-Control: private, no-store, max-age=0` as a safety net even if an individual API route forgets to set cache headers.
- `/admin/*`, `/worker/*`, and `/employer/*` receive `X-Robots-Tag: noindex, nofollow, noarchive`.
- Prompt 37 service-worker and manifest cache headers remain intact.
