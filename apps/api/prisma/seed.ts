import {
  ContentType,
  PrismaClient,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  Role
} from "@prisma/client";
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
  },
  {
    email: "user1@trustops.dev",
    name: "TrustOps User One",
    role: Role.VIEWER
  },
  {
    email: "user2@trustops.dev",
    name: "TrustOps User Two",
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

  const usersByEmail = new Map<string, { id: string }>();

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

    usersByEmail.set(demoUser.email, user);

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

  await prisma.contentItem.deleteMany({
    where: {
      organizationId: organization.id,
      externalId: {
        in: ["seed-post-1", "seed-comment-1", "seed-profile-1"]
      }
    }
  });

  const owner = usersByEmail.get("owner@trustops.dev");
  const admin = usersByEmail.get("admin@trustops.dev");
  const moderator = usersByEmail.get("mod@trustops.dev");
  const viewer = usersByEmail.get("viewer@trustops.dev");

  if (!owner || !admin || !moderator || !viewer) {
    throw new Error("Seed users were not created");
  }

  const post = await prisma.contentItem.create({
    data: {
      organizationId: organization.id,
      authorUserId: viewer.id,
      type: ContentType.POST,
      title: "Neighborhood safety update",
      body: "Sharing an update from the community forum.",
      externalId: "seed-post-1"
    }
  });

  const comment = await prisma.contentItem.create({
    data: {
      organizationId: organization.id,
      authorUserId: owner.id,
      type: ContentType.COMMENT,
      body: "This comment needs a moderator decision.",
      externalId: "seed-comment-1"
    }
  });

  await prisma.contentItem.create({
    data: {
      organizationId: organization.id,
      authorUserId: admin.id,
      type: ContentType.PROFILE,
      title: "Demo profile",
      body: "Sample profile content for Phase 2 moderation review.",
      externalId: "seed-profile-1"
    }
  });

  const spamReport = await prisma.report.create({
    data: {
      organizationId: organization.id,
      contentItemId: post.id,
      reporterUserId: owner.id,
      assignedModeratorId: moderator.id,
      reason: ReportReason.SPAM,
      severity: ReportSeverity.MEDIUM,
      status: ReportStatus.IN_REVIEW,
      description: "Looks like repeated promotional content."
    }
  });

  await prisma.reportEvent.create({
    data: {
      reportId: spamReport.id,
      actorUserId: owner.id,
      toStatus: ReportStatus.OPEN,
      message: "Seed report created"
    }
  });

  await prisma.reportEvent.create({
    data: {
      reportId: spamReport.id,
      actorUserId: moderator.id,
      fromStatus: ReportStatus.OPEN,
      toStatus: ReportStatus.IN_REVIEW,
      message: "Seed report assigned"
    }
  });

  await prisma.report.create({
    data: {
      organizationId: organization.id,
      contentItemId: comment.id,
      reporterUserId: viewer.id,
      reason: ReportReason.HARASSMENT,
      severity: ReportSeverity.HIGH,
      description: "Concern about targeted language."
    }
  });
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
