"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state-block";
import { displayUser, formatDate, trustOpsApi } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const response = await trustOpsApi.listAuditLogs();
        setLogs(response.data);
        setNextCursor(response.nextCursor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load audit logs"
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    try {
      setIsPaging(true);
      const response = await trustOpsApi.listAuditLogs(nextCursor);
      setLogs((current) => [...current, ...response.data]);
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setIsPaging(false);
    }
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Operational history</p>
          <h1>Audit logs</h1>
        </div>
      </div>

      {isLoading ? <LoadingBlock label="Loading audit logs..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!isLoading && !error && logs.length === 0 ? (
        <EmptyBlock label="No audit logs are currently visible." />
      ) : null}
      {!isLoading && logs.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Created</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="strong">{log.action.replaceAll("_", " ")}</td>
                    <td>{displayUser(log.actor)}</td>
                    <td>{log.entityType}</td>
                    <td>
                      <code>{log.entityId}</code>
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <pre>{JSON.stringify(log.metadata ?? {}, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            <span>{logs.length} logs loaded</span>
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
