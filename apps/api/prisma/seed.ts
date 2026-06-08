import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoUsers = [
  {
    email: "owner@trustops.dev",
    name: "TrustOps Owner",
    role: Role.OWNER
  },
  {
    email: "admin@trustops.dev",
    name: "TrustOps Admin",
    role: Role.ADMIN
  },
  {
    email: "mod@trustops.dev",
    name: "TrustOps Moderator",
    role: Role.MODERATOR
  },
  {
    email: "viewer@trustops.dev",
    name: "TrustOps Viewer",
    role: Role.VIEWER
  }
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const organization = await prisma.organization.upsert({
    where: { slug: "trustops-demo" },
    update: {},
    create: {
      name: "TrustOps Demo",
      slug: "trustops-demo"
    }
  });

  for (const demoUser of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name
      },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash
      }
    });

    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id
        }
      },
      update: {
        role: demoUser.role
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: demoUser.role
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
