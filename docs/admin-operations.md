# Prompt 36 — Admin Operations Center

Prompt 36 replaces the hard-coded Admin dashboard with database-backed production operations tooling.

## Dashboard

`GET /api/admin/overview` returns live counts for users, Workers, Employers, blocked accounts, active shifts, open disputes, and Audit events in the last 24 hours. Metrics require `admin.audit.view` and are never embedded as fake UI constants.

## User management

`GET /api/admin/users` provides cursor pagination plus search by name/mobile/email and filters for role and blocked state. It requires `admin.users.manage`.

`PATCH /api/admin/users/:id/status` changes `isBlocked` with a required reason.

Safety rules:

- Admins cannot block or unblock their own account.
- Only `SUPER_ADMIN` may change the blocked state of `ADMIN` or `SUPER_ADMIN` targets.
- The mutation is serialized with a PostgreSQL advisory transaction lock.
- Repeating the requested final state is idempotent.
- Blocking deletes all active Sessions for the target inside the same transaction, providing immediate force logout.
- Every state change creates an Audit Log containing reason, target role, previous/current state, revoked session count, actor, and request IP.

## Audit Log

`GET /api/admin/audit` supports cursor pagination and filtering/search by action, entity name, entity ID, and actor. It requires `admin.audit.view`.

Before returning Audit details, nested keys whose names resemble password, secret, token, authorization, OTP, or code are replaced with `[REDACTED]`. This prevents operational tooling from accidentally exposing credential material that may have been written by legacy Audit producers.

## Database indexes

Prompt 36 adds indexes for:

- `users.is_blocked`
- `audit_logs.entity_name`
- `audit_logs.action`

The migration is registered as `0018_admin_operations_indexes`.

## UI

`/admin` now shows real metrics. `/admin/users` provides user filtering and audited block/unblock operations. `/admin/audit` provides searchable redacted audit history. `/admin/disputes` is retained inside the same Admin navigation shell.
