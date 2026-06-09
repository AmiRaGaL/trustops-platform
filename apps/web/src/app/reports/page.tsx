"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state-block";
import { StatusPill } from "@/components/status-pill";
import { displayUser, formatDate, trustOpsApi } from "@/lib/api";
import type { AdminReport, ReportFilters } from "@/lib/types";

const statuses = ["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED", "DISMISSED"];
const reasons = [
  "HARASSMENT",
  "SPAM",
  "HATE_SPEECH",
  "IMPERSONATION",
  "SELF_HARM",
  "VIOLENCE",
  "OTHER"
];
const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [draftFilters, setDraftFilters] = useState<ReportFilters>({});
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);

  const stableFilters = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setIsLoading(true);
        const response = await trustOpsApi.listReports(filters);
        setReports(response.data);
        setNextCursor(response.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [filters, stableFilters]);

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    try {
      setIsPaging(true);
      const response = await trustOpsApi.listReports({
        ...filters,
        cursor: nextCursor
      });
      setReports((current) => [...current, ...response.data]);
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports");
    } finally {
      setIsPaging(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters({});
    setFilters({});
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Moderator queue</p>
          <h1>Reports</h1>
        </div>
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <label>
          Status
          <select
            value={draftFilters.status ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value || undefined
              }))
            }
          >
            <option value="">Any status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason
          <select
            value={draftFilters.reason ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                reason: event.target.value || undefined
              }))
            }
          >
            <option value="">Any reason</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select
            value={draftFilters.severity ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                severity: event.target.value || undefined
              }))
            }
          >
            <option value="">Any severity</option>
            {severities.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assigned moderator ID
          <input
            value={draftFilters.assignedModeratorId ?? ""}
            placeholder="Optional user id"
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                assignedModeratorId: event.target.value || undefined
              }))
            }
          />
        </label>
        <div className="filter-actions">
          <button className="primary-button" type="submit">
            Apply
          </button>
          <button className="secondary-button" type="button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {isLoading ? <LoadingBlock label="Loading report queue..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!isLoading && !error && reports.length === 0 ? (
        <EmptyBlock label="No reports match these filters." />
      ) : null}
      {!isLoading && reports.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Severity</th>
                  <th>Content</th>
                  <th>Reporter</th>
                  <th>Assigned</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/reports/${report.id}`}>
                        <StatusPill value={report.status} />
                      </Link>
                    </td>
                    <td>{report.reason.replaceAll("_", " ")}</td>
                    <td>
                      <StatusPill value={report.severity} />
                    </td>
                    <td>
                      <span className="strong">{report.contentItem.type}</span>
                      <small>{report.contentItem.title ?? report.contentItem.body}</small>
                    </td>
                    <td>{displayUser(report.reporter)}</td>
                    <td>{displayUser(report.assignedModerator)}</td>
                    <td>{formatDate(report.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            <span>{reports.length} reports loaded</span>
            <button
              className="secondary-button"
              type="button"
              disabled={!nextCursor || isPaging}
              onClick={loadMore}
            >
              {isPaging ? "Loading..." : "Load more"}
            </button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
