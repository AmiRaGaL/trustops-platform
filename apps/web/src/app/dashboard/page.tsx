"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state-block";
import { StatusPill } from "@/components/status-pill";
import { displayUser, formatDate, trustOpsApi } from "@/lib/api";
import type { AdminReport } from "@/lib/types";

export default function DashboardPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const response = await trustOpsApi.listReports();
        setReports(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const metrics = useMemo(() => {
    const open = reports.filter((report) => report.status === "OPEN").length;
    const inReview = reports.filter(
      (report) => report.status === "IN_REVIEW"
    ).length;
    const escalated = reports.filter(
      (report) => report.status === "ESCALATED"
    ).length;
    const critical = reports.filter(
      (report) => report.severity === "CRITICAL"
    ).length;

    return [
      { label: "Open", value: open },
      { label: "In review", value: inReview },
      { label: "Escalated", value: escalated },
      { label: "Critical", value: critical }
    ];
  }, [reports]);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Moderation overview</p>
          <h1>Dashboard</h1>
        </div>
      </div>

      {isLoading ? <LoadingBlock label="Loading moderation metrics..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!isLoading && !error ? (
        <>
          <section className="metric-grid" aria-label="Moderation metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Recent reports</h2>
            </div>
            {reports.length === 0 ? (
              <EmptyBlock label="No reports are currently visible." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Severity</th>
                      <th>Reporter</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 8).map((report) => (
                      <tr key={report.id}>
                        <td>
                          <StatusPill value={report.status} />
                        </td>
                        <td>{report.reason.replaceAll("_", " ")}</td>
                        <td>
                          <StatusPill value={report.severity} />
                        </td>
                        <td>{displayUser(report.reporter)}</td>
                        <td>{formatDate(report.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
