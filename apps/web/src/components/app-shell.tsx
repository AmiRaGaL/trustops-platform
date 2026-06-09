"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/audit-logs", label: "Audit Logs" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <main className="centered-page">Loading workspace...</main>;
  }

  if (!isAuthenticated) {
    return <main className="centered-page">Redirecting to login...</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <Link className="brand" href="/dashboard">
            <span className="brand-mark">T</span>
            <span>
              <strong>TrustOps</strong>
              <small>Admin</small>
            </span>
          </Link>
          <nav className="nav-list" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={pathname.startsWith(item.href) ? "active" : ""}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <span>{user?.name ?? user?.email}</span>
          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
