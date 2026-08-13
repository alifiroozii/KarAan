# KarAan (کارآن) - Role & Granular Permission Matrix

This document defines the Role-Based Access Control (RBAC) and Granular Permission Matrix for all 9 platform roles.

---

## 🎭 Platform Roles

1. **`WORKER`**: Shift worker looking for hourly job assignments.
2. **`EMPLOYER`**: Store/Business owner creating and managing shift budgets.
3. **`BRANCH_MANAGER`**: Manager assigned to a specific business branch.
4. **`SHIFT_SUPERVISOR`**: On-site supervisor verifying worker attendance and breaks.
5. **`SUPPORT_AGENT`**: Customer support resolving worker & employer queries.
6. **`DISPUTE_AGENT`**: Specialized agent reviewing timesheet and attendance disputes.
7. **`FINANCE_ADMIN`**: Financial administrator overseeing ledger, escrow, & payouts.
8. **`ADMIN`**: Platform administrator managing users, businesses, & shifts.
9. **`SUPER_ADMIN`**: Master administrator with unrestricted system permissions.

---

## 📊 Granular Permission Matrix

| Permission Key | WORKER | EMPLOYER | BRANCH_MGR | SUPERVISOR | SUPPORT | DISPUTE | FINANCE | ADMIN | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `worker.profile.read` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `worker.profile.update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `worker.availability.update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `worker.documents.upload` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `employer.profile.read` | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `employer.profile.update` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `business.create` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `business.read` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `business.update` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `business.delete` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `branch.create` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `branch.read` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `branch.update` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `branch.delete` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `shift.create` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `shift.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `shift.publish` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `shift.update` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `shift.cancel` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `shift.apply` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `shift.accept` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `shift.checkin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `shift.checkout` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `timesheet.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `timesheet.approve` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `timesheet.dispute` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `payment.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `payment.topup` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `payment.payout` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `dispute.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `dispute.view` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `dispute.manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| `admin.users.manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `admin.audit.view` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin.system.manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Object-Level Authorization (Ownership Enforcement)

Role-based permissions (RBAC) are combined with **Object-Level Authorization** (`assertOwnership`):

- **Rule**: Even if User A has role `EMPLOYER`, they CANNOT view or edit a Shift created by Employer B (`shift.employerId !== actorUserId`).
- **Override**: `SUPER_ADMIN` and `ADMIN` roles bypass object-level ownership checks for system oversight.
