# Prompt 21 — Secure Attendance

Prompt 21 replaces the public GPS-only attendance mutation path with a credential-backed attendance flow.

## Worker flow

- `ARRIVED -> CHECKED_IN` requires a short-lived branch QR or one-time supervisor code.
- `CHECKED_IN -> CHECKED_OUT` uses the same credential model with `CHECK_OUT` purpose.
- Active breaks block check-out until the break is ended.
- Worker ownership, assignment state, branch, GPS accuracy, geofence and check-in time window are validated server-side.

## Credentials

- QR credentials are opaque random tokens.
- Raw QR values are never written to database audit records.
- Redis stores only a SHA-256 keyed credential record with TTL.
- Default QR TTL: 45 seconds, configurable through `attendance.qr_ttl_seconds`.
- Supervisor codes are six digits, branch/purpose bound and one-time.
- Default supervisor-code TTL: 120 seconds, configurable through `attendance.supervisor_code_ttl_seconds`.
- Concurrent supervisor-code consumption is serialized with a short Redis NX lock.

## Authorization

QR/code generation is restricted to employer operational roles and then object-level branch ownership/membership is verified by `AttendanceCredentialService`.

## Location policy

- Default maximum GPS accuracy: 80 meters (`location.max_accuracy_meters`).
- Shift geofence radius comes from the shift record.
- Check-in defaults to 30 minutes early through 60 minutes late and is configurable.

## Browser support

Worker PWA uses `BarcodeDetector` when available. Browsers without QR detector support, including unsupported Safari/iOS combinations, fall back to the supervisor-code flow without weakening server-side validation.

## Legacy API

Direct GPS-only `/api/attendance/check-in` and `/api/attendance/check-out` endpoints return `410` and no longer mutate attendance. The supported worker APIs are `/api/attendance/scan` and `/api/attendance/code`.
