# 0002: Why Organization-Scoped RBAC

## Context

TrustOps is multi-tenant. A moderator may be trusted to review reports for one organization but should not automatically see every tenant's reports. Global roles would be simpler but would not model real trust and safety operations well.

## Decision

Represent access with `Membership` records that connect a user, an organization, and a role. Moderator/admin endpoints allow `OWNER`, `ADMIN`, and `MODERATOR` roles only within the relevant organization.

## Alternatives Considered

- Global user roles such as one `isAdmin` field on `User`.
- Per-report access control lists.
- Policy engine integration.

## Tradeoffs

Organization-scoped RBAC is more realistic and prevents cross-tenant access by default. It requires extra access checks in services, but those checks are explicit and easy to test. A policy engine would be more flexible, but it would add complexity before the project needs it.
