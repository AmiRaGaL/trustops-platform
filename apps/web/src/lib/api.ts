import { clearStoredToken, getStoredToken } from "./auth-storage";
import type {
  AdminReport,
  AuditLog,
  AuthResponse,
  ModerationActionType,
  PageResponse,
  ReportDetail,
  ReportFilters,
  UserSummary
} from "./types";

const DEFAULT_API_URL = "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean;
};

function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? DEFAULT_API_URL
  );
}

function redirectToLogin(): void {
  clearStoredToken();

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (Array.isArray(payload.message)) {
      return payload.message.join(", ");
    }

    if (typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    return response.statusText || "Request failed";
  }

  return response.statusText || "Request failed";
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const isAuthenticatedRequest = options.auth !== false;
  const headers = new Headers({
    Accept: "application/json"
  });

  const token = isAuthenticatedRequest ? getStoredToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body
  });

  if (response.status === 401 && isAuthenticatedRequest) {
    redirectToLogin();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function queryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const trustOpsApi = {
  login(email: string, password: string) {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password }
    });
  },

  me() {
    return apiFetch<UserSummary>("/auth/me");
  },

  listReports(filters: ReportFilters = {}) {
    return apiFetch<PageResponse<AdminReport>>(
      `/admin/reports${queryString(filters)}`
    );
  },

  getReport(id: string) {
    return apiFetch<ReportDetail>(`/admin/reports/${id}`);
  },

  assignReport(id: string, moderatorUserId: string) {
    return apiFetch<ReportDetail>(`/admin/reports/${id}/assign`, {
      method: "POST",
      body: { moderatorUserId }
    });
  },

  addInternalNote(id: string, body: string) {
    return apiFetch(`/admin/reports/${id}/notes`, {
      method: "POST",
      body: { body }
    });
  },

  takeModerationAction(
    id: string,
    actionType: ModerationActionType,
    reason?: string
  ) {
    return apiFetch<ReportDetail>(`/admin/reports/${id}/actions`, {
      method: "POST",
      body: { actionType, reason: reason || undefined }
    });
  },

  escalateReport(id: string) {
    return apiFetch<ReportDetail>(`/admin/reports/${id}/escalate`, {
      method: "POST"
    });
  },

  listAuditLogs(cursor?: string) {
    return apiFetch<PageResponse<AuditLog>>(
      `/admin/audit-logs${queryString({ cursor })}`
    );
  }
};

export function isTerminalReport(status: string): boolean {
  return status === "RESOLVED" || status === "DISMISSED";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Unassigned";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function displayUser(user: UserSummary | null | undefined): string {
  if (!user) {
    return "Unassigned";
  }

  return user.name ? `${user.name} (${user.email})` : user.email;
}
