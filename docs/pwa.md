# Prompt 37 — Production PWA

Prompt 37 turns the existing partial manifest into a real installable PWA while keeping authenticated KarAan data out of persistent service-worker caches.

## Installability

- Valid 192×192 and 512×512 PNG app icons are included.
- A 180×180 Apple touch icon and 96×96 notification badge are included.
- `manifest.json` now defines app `id`, root `scope`, safe root `start_url`, Persian `lang`/`dir`, standalone display, maskable icon support, and Worker/Employer shortcuts.
- Root metadata exposes the manifest and app icons.
- The service worker is registered only in production with `updateViaCache: none`.

## Offline security model

KarAan handles location, messaging, shifts, identity, and financial state. Prompt 37 therefore deliberately does **not** implement an offline-first data cache.

`sw.js` never intercepts/cache-serves:

- `/api/*`
- `/socket.io/*`
- authenticated navigation responses
- arbitrary same-origin images or user uploads

Navigation remains network-first. If the network is unavailable, the worker returns a standalone public `/offline.html` page explaining that private operational data is not stored offline.

Only explicit PWA assets and immutable `/_next/static/*` assets use Cache Storage.

## Push presentation

The service worker includes `push` and `notificationclick` handlers so a real Push provider can display notifications through the installed PWA. Notification target URLs are accepted only when they are root-relative and not protocol-relative (`//...`); otherwise the click falls back to `/worker/notifications`.

Prompt 37 does not invent Push subscriptions or provider credentials. Those remain the responsibility of the Prompt 33 Push adapter/provider integration.

## Update behavior

- The service worker script is served with `max-age=0, must-revalidate`.
- `Service-Worker-Allowed: /` explicitly permits root scope.
- Old `karaan-static-*` caches are removed on activation.
- The worker calls `skipWaiting()` and `clients.claim()` so new application shells take control promptly.
