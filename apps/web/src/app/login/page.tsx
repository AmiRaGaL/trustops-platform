"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const demoUsers = [
  { role: "Moderator", email: "mod@trustops.dev" },
  { role: "Admin", email: "admin@trustops.dev" },
  { role: "Owner", email: "owner@trustops.dev" }
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("mod@trustops.dev");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Local demo dashboard</p>
          <h1 id="login-title">TrustOps Admin</h1>
          <p className="muted">
            Sign in with seeded local credentials to review reports, actions,
            and audit activity.
          </p>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? (
            <div className="inline-error" role="alert">
              {error}
            </div>
          ) : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="demo-credentials">
          <p>Demo credentials for local seed data</p>
          {demoUsers.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => {
                setEmail(user.email);
                setPassword("Password123!");
              }}
            >
              <strong>{user.role}</strong>
              <span>{user.email}</span>
              <small>Password123!</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
