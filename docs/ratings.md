# Two-way Quality Ratings

Prompt 28 implements Quality Rating as a separate domain from Reliability.

## Separation from Reliability

A 1–5 star rating, its tags, and comments never mutate `worker_profiles.reliability_score`.

- **Quality Rating** answers: how good was the work / collaboration experience?
- **Reliability** answers: did the Worker show up, cancel late, complete shifts, etc.?

Only `ReliabilityService` can mutate Reliability.

## Rating directions

Each Assignment permits at most one rating in each direction:

- `WORKER_TO_EMPLOYER`
- `EMPLOYER_TO_WORKER`

A database unique index on `(assignment_id, direction)` enforces this even under concurrent requests.

The client never supplies `evaluateeId` or direction.

Server rules:

- a Worker can rate only the Employer of their own Assignment;
- the Employer owner / authorized Branch Manager / authorized Shift Supervisor can rate only the Worker on that Assignment;
- unrelated users cannot rate either side.

## Eligibility

Ratings are accepted only after real work has ended:

- `CHECKED_OUT`
- `COMPLETED`
- `LEFT_EARLY`

Cancelled and No-show Assignments are not rateable through this flow.

## Idempotency and concurrency

Submission uses a PostgreSQL advisory lock scoped to `rating:<assignmentId>:<direction>` and checks for an existing direction before insert.

A retry returns the existing rating instead of creating another one.

## Validation

- score must be an integer from 1 to 5;
- maximum 5 tags;
- tags must come from the server-provided allowlist for that direction;
- optional comment is limited to 1000 characters.

## APIs

Assignment context / existing rating:

`GET /api/assignments/[id]/ratings`

Submit:

`POST /api/assignments/[id]/ratings`

Worker quality aggregate:

`GET /api/worker/ratings/summary`

## UI

Both Worker and Employer Timesheet detail pages render the shared `AssignmentRatingCard` after the Assignment becomes eligible.

The Worker dashboard displays the real Employer-to-Worker average and rating count. Reliability is displayed independently beside it.

## Migration

`0011_two_way_ratings.sql` adds the direction column, infers legacy rating direction from Assignment participation, and refuses to add the unique constraint if duplicate direction records require manual review.
