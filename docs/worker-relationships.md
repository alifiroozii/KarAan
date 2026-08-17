# Worker Relationships

Prompt 29 adds explicit future-collaboration relationships between Employers and Workers.

## Employer roster

For each canonical Employer profile and Worker profile there can be at most one roster relationship:

- `FAVORITE` — Employer wants to keep the Worker easy to find.
- `PREFERRED` — Worker should receive higher matching priority when otherwise eligible.
- `BLOCKED` — Worker must not be matched with this Employer.

The `(employer_profile_id, worker_profile_id)` pair is unique. Updating the relationship changes the existing row instead of creating conflicting FAVORITE/PREFERRED/BLOCKED records.

Branch Managers and Shift Supervisors operate on the canonical Employer profile belonging to the Shift owner. They do not create personal private rosters.

## Authorization

An Employer/Manager cannot create a relationship with an arbitrary Worker id.

The service first proves that the actor manages a Shift containing an Assignment with that Worker. The same object-level authorization model used by Shift operations is reused.

## Two-way block

The `blocks` table represents a user-to-user directional block:

`blocker_user_id -> blocked_user_id`

The pair is unique and users cannot block themselves.

The Assignment counterparty endpoint derives the other user server-side. The client never chooses an arbitrary `blockedUserId`.

Either side may block the other after a real Assignment relationship. A block by either side is enough to prevent future matching between the Worker and that Employer.

Employer-side block also synchronizes the canonical Employer roster to `BLOCKED`. Unblocking removes only the `BLOCKED` roster state; it does not invent a previous FAVORITE/PREFERRED state.

## Matching rules

Relationship preference is applied only after hard eligibility rules.

Hard exclusion, in order of effect:

- active Reliability sanction;
- explicit matcher exclusion;
- Worker blocks Employer;
- Employer blocks Worker;
- Employer roster is `BLOCKED`;
- normal verification / availability / distance / min Reliability requirements.

Only eligible Workers are ranked by relationship:

1. `PREFERRED`
2. `FAVORITE`
3. no relationship

Within the same relationship priority, higher Reliability wins, then shorter distance.

PREFERRED/FAVORITE can never bypass a sanction, block, distance limit, verification requirement or minimum Reliability.

## APIs

Employer roster relationship:

- `GET /api/employer/workers/[id]/relationship`
- `PUT /api/employer/workers/[id]/relationship`

Assignment-derived block relationship:

- `GET /api/assignments/[id]/counterparty-block`
- `PUT /api/assignments/[id]/counterparty-block`

## UI

Employer Live Operations shows controls for:

- Favorite
- Preferred
- Block / unblock

Worker and Employer Timesheet detail pages both expose the shared counterparty block control after a real Assignment relationship exists.

## Data integrity

Migration `0012_worker_relationships.sql` refuses to create unique indexes when duplicate legacy roster/block rows require manual review. It does not silently delete production relationship data.

All relationship changes write AuditLog entries.
