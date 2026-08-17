# Prompt 35 — Assignment Messaging

Prompt 35 adds production in-app messaging without turning KarAan into an unrestricted social chat system. Every conversation is bound to one real `shift_assignment` and inherits its authorization boundary.

## Lifecycle and access

- One durable Conversation per Assignment.
- Worker, Employer, Branch Manager, or authorized Business member can create/open the Assignment conversation when they have `message.send` and object-level access.
- Support/Admin roles may receive `message.view` for investigation, but do not receive `message.send` and therefore cannot impersonate either party.
- `OFFERED`, `VIEWED`, `DECLINED`, and `REMOVED` assignments cannot send chat messages.
- After the shift ends, sending remains available for seven days for operational follow-up; after that the history becomes read-only.

## Idempotency and abuse controls

- Conversation IDs are deterministic from the Assignment and creation is protected by a PostgreSQL advisory transaction lock plus a unique Assignment index.
- `POST /messages` requires `Idempotency-Key`. Message IDs are deterministically derived from `(conversation, sender, key)` so network retries return the same message instead of duplicating it.
- Reusing the same key with different content returns `409 CONFLICT`.
- Per-conversation/sender writes are serialized and capped at 20 messages/minute.
- Text is trimmed and limited to 2,000 characters. Arbitrary attachment URLs are intentionally not exposed until an authenticated upload pipeline exists.

## Realtime and read receipts

`chat.message` publishes the durable message identity, Assignment, sender, content, and timestamp. `chat.read` publishes the recipient-side read timestamp. Both invalidate conversation/message React Query caches.

`messages.read_at` represents recipient-side read state. For Employer organizations with multiple authorized operators, the first authorized operator to open the conversation marks received messages as read for that organization side.

## Notifications

A newly created message writes a durable Prompt 33 `SYSTEM_ANNOUNCEMENT` notification with `data.subtype = MESSAGE`; in-app delivery is always recorded and Push follows user preferences. Notification creation is idempotent by Message ID.

## API

- `POST /api/assignments/:id/conversation` — create/get the Assignment conversation.
- `GET /api/conversations` — actor-scoped conversation list.
- `GET /api/conversations/:id/messages?cursor=...&limit=...` — cursor-paginated history.
- `POST /api/conversations/:id/messages` — idempotent send.
- `POST /api/conversations/:id/read` — mark received messages read.

## UI

Worker and Employer dashboards expose a Conversations destination. A Worker can open chat from the current shift; an Employer can open chat per assigned Worker from shift details. The shared Messaging Center provides unread badges, pagination, realtime refresh, send state, and read-only history after the send window closes.
