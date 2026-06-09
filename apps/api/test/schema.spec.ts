import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Prisma schema review safeguards", () => {
  it("preserves audit logs when actor users are deleted", () => {
    const schema = readFileSync(
      resolve(process.cwd(), "prisma/schema.prisma"),
      "utf8"
    );
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "prisma/migrations/20260610000000_preserve_audit_logs_on_user_delete/migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("actorUserId    String?");
    expect(schema).toContain("actor          User?        @relation");
    expect(schema).toContain("onDelete: SetNull");
    expect(migration).toContain("ALTER COLUMN \"actorUserId\" DROP NOT NULL");
    expect(migration).toContain("ON DELETE SET NULL");
  });
});
