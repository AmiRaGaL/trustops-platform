# 0004: Why No ML Classifier Yet

## Context

Trust and safety products often use automated classifiers, but this project is currently focused on workflow, data modeling, authorization, and auditability. Adding ML too early would distract from those foundations.

## Decision

Do not add an ML classifier in this phase. Keep reports user-generated and moderator-reviewed.

## Alternatives Considered

- Add a simple keyword classifier.
- Add a mock classifier service.
- Add a third-party model API integration.

## Tradeoffs

Skipping ML keeps the demo honest and focused. It avoids fake precision, external API keys, model safety questions, and extra infrastructure. The tradeoff is that TrustOps does not demonstrate automated triage yet. A future classifier could be added behind a queue with explicit confidence scores, human review, and auditability.
