# 0003: Why Audit Logs And Report Events

## Context

Moderation systems need two related histories: the lifecycle of a case and the accountability trail for administrative actions. Combining both into one table would make the data model smaller but blur their meaning.

## Decision

Use `ReportEvent` for report lifecycle history and `AuditLog` for administrative accountability.

## Alternatives Considered

- Store all history in a single append-only events table.
- Store only the current report status and omit history.
- Use audit logs only for security-sensitive actions.

## Tradeoffs

Separate tables make the product easier to explain: report events answer "what happened to this case?" while audit logs answer "who did what to which entity?" This creates some duplicate writes during moderation actions, but it keeps queries simple and preserves clear semantics.
