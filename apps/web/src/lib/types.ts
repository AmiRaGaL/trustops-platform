export type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: UserSummary;
};

export type ReportStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "ESCALATED"
  | "RESOLVED"
  | "DISMISSED";

export type ReportReason =
  | "HARASSMENT"
  | "SPAM"
  | "HATE_SPEECH"
  | "IMPERSONATION"
  | "SELF_HARM"
  | "VIOLENCE"
  | "OTHER";

export type ReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ContentType = "POST" | "COMMENT" | "PROFILE";

export type ModerationActionType =
  | "WARN_USER"
  | "HIDE_CONTENT"
  | "SUSPEND_USER"
  | "DISMISS_REPORT"
  | "ESCALATE_REPORT"
  | "NO_ACTION";

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string | null;
  body: string;
  isHidden?: boolean;
  author?: UserSummary;
  createdAt: string;
};

export type AdminReport = {
  id: string;
  status: ReportStatus;
  reason: ReportReason;
  severity: ReportSeverity;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  contentItem: ContentItem;
  reporter: UserSummary;
  assignedModerator: UserSummary | null;
};

export type ReportEvent = {
  id: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  message: string | null;
  createdAt: string;
  actor: UserSummary | null;
};

export type InternalNote = {
  id: string;
  body: string;
  createdAt: string;
  author: UserSummary;
};

export type ModerationAction = {
  id: string;
  actionType: ModerationActionType;
  reason: string | null;
  createdAt: string;
  actor: UserSummary;
};

export type ReportDetail = AdminReport & {
  events: ReportEvent[];
  internalNotes: InternalNote[];
  moderationActions: ModerationAction[];
};

export type PageResponse<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ReportFilters = {
  status?: string;
  reason?: string;
  severity?: string;
  assignedModeratorId?: string;
  cursor?: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: UserSummary | null;
};
