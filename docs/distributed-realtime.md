# Prompt 40 — Distributed Realtime Transport

Prompt 40 extends KarAan realtime delivery across multiple application/Socket.IO instances using Redis Pub/Sub while preserving the existing authenticated room model.

## Flow

1. Domain service calls `publishRealtimeEvent()`.
2. Local listeners and local Socket.IO clients receive the event immediately.
3. The same typed envelope is published to Redis channel `karaan:realtime:v1` with a unique `sourceInstanceId`.
4. Every long-lived `server.mjs` Socket.IO runtime subscribes to that channel.
5. A subscriber ignores envelopes created by its own instance and emits remote envelopes only to the exact room in the message.

This prevents duplicate local delivery while allowing API mutations and connected clients to live on different instances.

## Safety

- The Redis envelope carries only room, event, typed payload, timestamp and source instance identity.
- Subscriber input is parsed defensively and validates room prefixes, room identifier shape, event-name shape, payload object and timestamp before emitting.
- Existing Socket.IO room authorization remains unchanged: clients still cannot join arbitrary assignment/shift/business/branch rooms.
- Redis delivery is a side channel. If publishing fails after a domain transaction, the durable source-of-truth mutation remains successful and the failure is logged rather than rolled back.
- A self-hosted production Socket.IO runtime fails startup if its Redis subscriber cannot connect, avoiding a silently split realtime cluster. Development logs a warning and can continue.

## Vercel boundary

Vercel-hosted Next.js API/serverless instances can publish domain events to Redis, but a persistent Socket.IO server still requires a long-lived runtime (for example a container/VM/service running `npm start`). Connect browser clients to that realtime host. The Redis bridge lets the Vercel API and that realtime service share event delivery without colocating them.

## Shutdown

`SIGTERM`/`SIGINT` closes Socket.IO, quits the Redis subscriber and closes PostgreSQL before process exit.
