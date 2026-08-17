WITH ranked AS (
  SELECT
    id,
    assignment_id,
    first_value(id) OVER (
      PARTITION BY assignment_id
      ORDER BY created_at ASC, id ASC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY assignment_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM conversations
  WHERE assignment_id IS NOT NULL
)
UPDATE messages AS m
SET conversation_id = ranked.keep_id
FROM ranked
WHERE ranked.rn > 1
  AND m.conversation_id = ranked.id;
--> statement-breakpoint
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY assignment_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM conversations
  WHERE assignment_id IS NOT NULL
)
DELETE FROM conversations AS c
USING ranked
WHERE ranked.rn > 1
  AND c.id = ranked.id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_conversations_assignment_id"
  ON "conversations" USING btree ("assignment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_created_at"
  ON "messages" USING btree ("conversation_id", "created_at");
