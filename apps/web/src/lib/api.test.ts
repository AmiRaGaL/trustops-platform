import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, apiFetch } from "./api";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

test("apiFetch attaches bearer tokens", async () => {
  const calls: FetchCall[] = [];
  globalThis.window = {
    localStorage: {
      getItem: () => "demo-token",
      setItem: () => undefined,
      removeItem: () => undefined
    }
  } as Window & typeof globalThis;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({ ok: true });
  };

  await apiFetch<{ ok: boolean }>("/health");

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.init?.headers instanceof Headers, true);
  assert.equal(
    (calls[0]?.init?.headers as Headers).get("Authorization"),
    "Bearer demo-token"
  );
});

test("apiFetch surfaces API errors", async () => {
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined
    }
  } as Window & typeof globalThis;
  globalThis.fetch = async () =>
    Response.json({ message: "Nope" }, { status: 403 });

  await assert.rejects(() => apiFetch("/admin/reports"), {
    name: "ApiError",
    message: "Nope",
    status: 403
  } satisfies Partial<ApiError>);
});

test("apiFetch does not redirect unauthenticated 401 errors", async () => {
  let removedToken = false;
  let redirectedTo = "";

  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        removedToken = true;
      }
    },
    location: {
      assign: (path: string) => {
        redirectedTo = path;
      }
    }
  } as Window & typeof globalThis;
  globalThis.fetch = async () =>
    Response.json(
      { message: "Invalid email or password" },
      { status: 401 }
    );

  await assert.rejects(
    () => apiFetch("/auth/login", { method: "POST", auth: false }),
    {
      name: "ApiError",
      message: "Invalid email or password",
      status: 401
    } satisfies Partial<ApiError>
  );
  assert.equal(removedToken, false);
  assert.equal(redirectedTo, "");
});
