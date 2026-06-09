import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { MembershipsController } from "../src/memberships/memberships.controller";
import { MembershipsService } from "../src/memberships/memberships.service";
import { PrismaService } from "../src/prisma/prisma.service";

type StoredMembership = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

class MembershipPrisma {
  memberships: StoredMembership[] = [
    this.createStoredMembership("owner-membership", "owner-1", Role.OWNER),
    this.createStoredMembership("admin-membership", "admin-1", Role.ADMIN),
    this.createStoredMembership(
      "moderator-membership",
      "moderator-1",
      Role.MODERATOR
    ),
    this.createStoredMembership("viewer-membership", "viewer-1", Role.VIEWER)
  ];

  membership = {
    findUnique: async ({
      where
    }: {
      where: {
        userId_organizationId: {
          userId: string;
          organizationId: string;
        };
      };
      select?: { role?: boolean; id?: boolean };
    }) => {
      const membership = this.memberships.find(
        (storedMembership) =>
          storedMembership.userId === where.userId_organizationId.userId &&
          storedMembership.organizationId ===
            where.userId_organizationId.organizationId
      );

      if (!membership) {
        return null;
      }

      return {
        id: membership.id,
        role: membership.role
      };
    },
    create: async ({
      data
    }: {
      data: Pick<StoredMembership, "userId" | "organizationId" | "role">;
      include?: unknown;
    }) => {
      const membership = this.createStoredMembership(
        `membership-${this.memberships.length + 1}`,
        data.userId,
        data.role,
        data.organizationId
      );

      this.memberships.push(membership);

      return {
        ...membership,
        user: {
          id: data.userId,
          email: `${data.userId}@trustops.dev`,
          name: data.userId
        },
        organization: {
          id: data.organizationId,
          name: "TrustOps Demo",
          slug: "trustops-demo"
        }
      };
    }
  };

  private createStoredMembership(
    id: string,
    userId: string,
    role: Role,
    organizationId = "organization-1"
  ): StoredMembership {
    const now = new Date();

    return {
      id,
      userId,
      organizationId,
      role,
      createdAt: now,
      updatedAt: now
    };
  }
}

function createService() {
  const prisma = new MembershipPrisma();
  const service = new MembershipsService(prisma as unknown as PrismaService);

  return {
    prisma,
    service
  };
}

describe("MembershipsController", () => {
  it("requires JWT authentication for membership creation", () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      MembershipsController.prototype.create
    );

    expect(guards).toEqual([JwtAuthGuard]);
  });
});

describe("MembershipsService", () => {
  it("blocks viewers from creating memberships", async () => {
    const { service } = createService();

    await expect(
      service.create("viewer-1", {
        userId: "new-user-1",
        organizationId: "organization-1",
        role: Role.VIEWER
      })
    ).rejects.toThrow("OWNER or ADMIN role is required");
  });

  it("blocks moderators from creating memberships", async () => {
    const { service } = createService();

    await expect(
      service.create("moderator-1", {
        userId: "new-user-1",
        organizationId: "organization-1",
        role: Role.VIEWER
      })
    ).rejects.toThrow("OWNER or ADMIN role is required");
  });

  it("blocks users from granting roles in organizations they do not belong to", async () => {
    const { service } = createService();

    await expect(
      service.create("admin-1", {
        userId: "new-user-1",
        organizationId: "organization-2",
        role: Role.VIEWER
      })
    ).rejects.toThrow(
      "Cannot create memberships for organizations you do not belong to"
    );
  });

  it("allows admins to create non-owner memberships", async () => {
    const { service } = createService();

    await expect(
      service.create("admin-1", {
        userId: "new-user-1",
        organizationId: "organization-1",
        role: Role.MODERATOR
      })
    ).resolves.toMatchObject({
      userId: "new-user-1",
      organizationId: "organization-1",
      role: Role.MODERATOR
    });
  });

  it("blocks admins from granting owner memberships", async () => {
    const { service } = createService();

    await expect(
      service.create("admin-1", {
        userId: "new-user-1",
        organizationId: "organization-1",
        role: Role.OWNER
      })
    ).rejects.toThrow("Only OWNER members can grant OWNER role");
  });

  it("allows owners to create owner memberships", async () => {
    const { service } = createService();

    await expect(
      service.create("owner-1", {
        userId: "new-owner-1",
        organizationId: "organization-1",
        role: Role.OWNER
      })
    ).resolves.toMatchObject({
      userId: "new-owner-1",
      organizationId: "organization-1",
      role: Role.OWNER
    });
  });
});
