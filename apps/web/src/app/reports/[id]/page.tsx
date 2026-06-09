"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state-block";
import { StatusPill } from "@/components/status-pill";
import {
  displayUser,
  formatDate,
  isTerminalReport,
  trustOpsApi
} from "@/lib/api";
import type { ModerationActionType, ReportDetail } from "@/lib/types";

const actionTypes: ModerationActionType[] = [
  "WARN_USER",
  "HIDE_CONTENT",
  "SUSPEND_USER",
  "DISMISS_REPORT",
  "NO_ACTION"
];

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const { user } = useAuth();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [actionType, setActionType] =
    useState<ModerationActionType>("WARN_USER");
  const [actionReason, setActionReason] = useState("");

  const loadReport = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      setReport(await trustOpsApi.getReport(reportId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load report");
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const isTerminal = report ? isTerminalReport(report.status) : false;

  async function runOperation(
    operation: () => Promise<unknown>,
    successMessage: string
  ) {
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await operation();
      await loadReport();
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function assignToMe() {
    if (!user) {
      return;
    }

    void runOperation(
      () => trustOpsApi.assignReport(reportId, user.id),
      "Report assigned to you."
    );
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = note.trim();
    if (!body) {
      return;
    }

    void runOperation(
      () => trustOpsApi.addInternalNote(reportId, body),
      "Internal note added."
    );
    setNote("");
  }

  function takeAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runOperation(
      () =>
        trustOpsApi.takeModerationAction(
          reportId,
          actionType,
          actionReason.trim()
        ),
      "Moderation action saved."
    );
    setActionReason("");
  }

  function escalate() {
    void runOperation(
      () => trustOpsApi.escalateReport(reportId),
      "Report escalated."
    );
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <Link className="back-link" href="/reports">
            Back to reports
          </Link>
          <h1>Report detail</h1>
        </div>
        {report ? <StatusPill value={report.status} /> : null}
      </div>

      {isLoading ? <LoadingBlock label="Loading report detail..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {notice ? <div className="state-block success">{notice}</div> : null}

      {!isLoading && report ? (
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Report metadata</h2>
            </div>
            <dl className="definition-grid">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusPill value={report.status} />
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{report.reason.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Severity</dt>
                <dd>
                  <StatusPill value={report.severity} />
                </dd>
              </div>
              <div>
                <dt>Reporter</dt>
                <dd>{displayUser(report.reporter)}</dd>
              </div>
              <div>
                <dt>Assigned moderator</dt>
                <dd>{displayUser(report.assignedModerator)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(report.createdAt)}</dd>
              </div>
            </dl>
            {report.description ? (
              <p className="description">{report.description}</p>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Reported content</h2>
              {report.contentItem.isHidden ? (
                <StatusPill value="HIDDEN" tone="danger" />
              ) : null}
            </div>
            <dl className="definition-grid">
              <div>
                <dt>Type</dt>
                <dd>{report.contentItem.type}</dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{displayUser(report.contentItem.author)}</dd>
              </div>
            </dl>
            {report.contentItem.title ? <h3>{report.contentItem.title}</h3> : null}
            <p className="content-body">{report.contentItem.body}</p>
          </section>

          <section className="panel operations-panel">
            <div className="panel-header">
              <h2>Operations</h2>
            </div>
            {isTerminal ? (
              <div className="state-block empty">
                Terminal reports cannot receive new moderation actions.
              </div>
            ) : null}
            <button
              className="primary-button"
              type="button"
              disabled={isSubmitting || isTerminal}
              onClick={assignToMe}
            >
              Assign to me
            </button>
            <form className="stack" onSubmit={addNote}>
              <label>
                Internal note
                <textarea
                  value={note}
                  rows={4}
                  disabled={isSubmitting || isTerminal}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <button
                className="secondary-button"
                type="submit"
                disabled={isSubmitting || isTerminal || !note.trim()}
              >
                Add note
              </button>
            </form>
            <form className="stack" onSubmit={takeAction}>
              <label>
                Action
                <select
                  value={actionType}
                  disabled={isSubmitting || isTerminal}
                  onChange={(event) =>
                    setActionType(event.target.value as ModerationActionType)
                  }
                >
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reason
                <textarea
                  value={actionReason}
                  rows={3}
                  disabled={isSubmitting || isTerminal}
                  onChange={(event) => setActionReason(event.target.value)}
                />
              </label>
              <div className="button-row">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSubmitting || isTerminal}
                >
                  Save action
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isSubmitting || isTerminal}
                  onClick={escalate}
                >
                  Escalate
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Internal notes</h2>
            </div>
            {report.internalNotes.length === 0 ? (
              <EmptyBlock label="No internal notes yet." />
            ) : (
              <div className="timeline">
                {report.internalNotes.map((item) => (
                  <article key={item.id}>
                    <strong>{displayUser(item.author)}</strong>
                    <time>{formatDate(item.createdAt)}</time>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Status history</h2>
            </div>
            {report.events.length === 0 ? (
              <EmptyBlock label="No status events returned." />
            ) : (
              <div className="timeline">
                {report.events.map((event) => (
                  <article key={event.id}>
                    <strong>
                      {event.fromStatus ?? "NEW"} to {event.toStatus}
                    </strong>
                    <time>{formatDate(event.createdAt)}</time>
                    <p>{event.message ?? "Status changed"}</p>
                    <small>{displayUser(event.actor)}</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Moderation actions</h2>
            </div>
            {report.moderationActions.length === 0 ? (
              <EmptyBlock label="No moderation actions yet." />
            ) : (
              <div className="timeline">
                {report.moderationActions.map((action) => (
                  <article key={action.id}>
                    <strong>{action.actionType.replaceAll("_", " ")}</strong>
                    <time>{formatDate(action.createdAt)}</time>
                    <p>{action.reason ?? "No reason provided"}</p>
                    <small>{displayUser(action.actor)}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
