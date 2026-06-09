import { ArgumentMetadata, ValidationPipe } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { HealthController } from "../src/health/health.controller";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { RegisterDto } from "../src/auth/dto/register.dto";
import { getRequiredConfig } from "../src/config/required-config";
import { PrismaService } from "../src/prisma/prisma.service";
import { UsersService } from "../src/users/users.service";

type StoredUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type PublicUser = Omit<StoredUser, "passwordHash">;

type StoredOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

type StoredMembership = {
  id: string;
  userId: string;
  organizationId: string;
  role: "OWNER";
  createdAt: Date;
  updatedAt: Date;
};

class InMemoryPrisma {
  private users: StoredUser[] = [];
  private organizations: StoredOrganization[] = [];
  private memberships: StoredMembership[] = [];

  user = {
    create: async ({
      data
    }: {
      data: Pick<StoredUser, "email" | "passwordHash"> & { name?: string };
    }) => {
      if (this.users.some((user) => user.email === data.email)) {
        const error = new Error("Unique constraint failed");
        Object.assign(error, { code: "P2002" });
        throw error;
      }

      const now = new Date();
      const user: StoredUser = {
        id: `user-${this.users.length + 1}`,
        email: data.email,
        name: data.name ?? null,
        passwordHash: data.passwordHash,
        createdAt: now,
        updatedAt: now
      };

      this.users.push(user);
      return this.toPublicUser(user);
    },
    findUnique: async ({
      where,
      select
    }: {
      where: { id?: string; email?: string };
      select?: Record<string, boolean>;
    }) => {
      const user = this.users.find((storedUser) =>
        where.id ? storedUser.id === where.id : storedUser.email === where.email
      );

      if (!user) {
        return null;
      }

      if (select?.passwordHash) {
        return user;
      }

      return this.toPublicUser(user);
    }
  };

  organization = {
    create: async ({
      data
    }: {
      data: Pick<StoredOrganization, "name" | "slug">;
    }) => {
      const now = new Date();
      const organization: StoredOrganization = {
        id: `organization-${this.organizations.length + 1}`,
        name: data.name,
        slug: data.slug,
        createdAt: now,
        updatedAt: now
      };

      this.organizations.push(organization);
      return organization;
    },
    findUnique: async ({ where }: { where: { slug: string } }) =>
      this.organizations.find(
        (organization) => organization.slug === where.slug
      ) ?? null
  };

  membership = {
    create: async ({
      data
    }: {
      data: Pick<StoredMembership, "userId" | "organizationId" | "role">;
    }) => {
      const now = new Date();
      const membership: StoredMembership = {
        id: `membership-${this.memberships.length + 1}`,
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
        createdAt: now,
        updatedAt: now
      };

      this.memberships.push(membership);
      return {
        role: membership.role
      };
    }
  };

  async $transaction<T>(callback: (prisma: InMemoryPrisma) => Promise<T>) {
    return callback(this);
  }

  async $disconnect() {
    return undefined;
  }

  private toPublicUser(user: StoredUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

describe("HealthController", () => {
  it("returns health status", () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: "ok",
      service: "trustops-api"
    });
  });
});

describe("AuthController", () => {
  let authController: AuthController;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: "test-secret",
          signOptions: {
            expiresIn: "1h"
          }
        })
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        {
          provide: PrismaService,
          useValue: new InMemoryPrisma()
        }
      ]
    }).compile();

    authController = moduleRef.get(AuthController);
    jwtService = moduleRef.get(JwtService);
  });

  it("registers and logs in a user without exposing the password hash", async () => {
    const registration = await authController.register({
      email: "new.user@trustops.dev",
      password: "Password123!",
      name: "New User",
      organizationName: "New User Org"
    });

    expect(registration.accessToken).toEqual(expect.any(String));
    expect(registration.user).toMatchObject({
      email: "new.user@trustops.dev",
      name: "New User"
    });
    expect(registration.organization).toMatchObject({
      name: "New User Org",
      slug: "new-user-org"
    });
    expect(registration.membershipRole).toBe("OWNER");
    expect("passwordHash" in registration.user).toBe(false);

    const login = await authController.login({
      email: "new.user@trustops.dev",
      password: "Password123!"
    });

    expect(login.accessToken).toEqual(expect.any(String));
    expect(login.user.id).toBe(registration.user.id);

    const payload = jwtService.verify<{ sub: string; email: string }>(
      login.accessToken
    );
    await expect(authController.me(payload)).resolves.toMatchObject({
      id: registration.user.id,
      email: "new.user@trustops.dev",
      name: "New User"
    });
  });

  it("rejects invalid login credentials", async () => {
    await expect(
      authController.login({
        email: "missing@trustops.dev",
        password: "Password123!"
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects duplicate email registration", async () => {
    const registration = {
      email: "duplicate@trustops.dev",
      password: "Password123!",
      name: "Duplicate User",
      organizationName: "Duplicate Org"
    };

    await authController.register(registration);

    await expect(authController.register(registration)).rejects.toThrow(
      "Email is already registered"
    );
  });
});

describe("RegisterDto validation", () => {
  const metadata: ArgumentMetadata = {
    type: "body",
    metatype: RegisterDto
  };

  it("rejects fields outside the expected registration DTO", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });

    await expect(
      pipe.transform(
        {
          email: "new.user@trustops.dev",
          password: "Password123!",
          name: "New User",
          organizationName: "New User Org",
          role: "OWNER"
        },
        metadata
      )
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(["property role should not exist"])
      }
    });
  });

  it("rejects an empty organizationName", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });

    await expect(
      pipe.transform(
        {
          email: "new.user@trustops.dev",
          password: "Password123!",
          name: "New User",
          organizationName: "   "
        },
        metadata
      )
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining([
          "organizationName should not be empty"
        ])
      }
    });
  });
});

describe("required config", () => {
  it("rejects a missing JWT_SECRET", () => {
    expect(() =>
      getRequiredConfig(
        {
          get: () => undefined
        } as never,
        "JWT_SECRET"
      )
    ).toThrow("JWT_SECRET is required");
  });
});
