import { ArgumentMetadata, ValidationPipe } from "@nestjs/common";
import {
  ContentType,
  ModerationActionType,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  Role
} from "@prisma/client";
import { AdminReportsService } from "../src/admin/admin-reports.service";
import { TakeModerationActionDto } from "../src/admin/dto/take-moderation-action.dto";
import { AuditLogsService } from "../src/audit-logs/audit-logs.service";
import { ModerationAccessService } from "../src/moderation/moderation-access.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { ReportsService } from "../src/reports/reports.service";

type StoredMembership = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
};

type StoredContentItem = {
  id: string;
  organizationId: string;
  authorUserId: string;
  type: ContentType;
  title: string | null;
  body: string;
  externalId: string | null;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StoredReport = {
  id: string;
  organizationId: string;
  contentItemId: string;
  reporterUserId: string;
  assignedModeratorId: string | null;
  reason: ReportReason;
  status: ReportStatus;
  severity: ReportSeverity;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
};

type StoredReportEvent = {
  id: string;
  reportId: string;
  actorUserId: string | null;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  message: string | null;
  createdAt: Date;
};

type StoredInternalNote = {
  id: string;
  reportId: string;
  authorUserId: string;
  body: string;
  createdAt: Date;
};

type StoredModerationAction = {
  id: string;
  reportId: string;
  actorUserId: string;
  actionType: ModerationActionType;
  details: string | null;
  createdAt: Date;
};

type StoredAuditLog = {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
};

class ModerationPrisma {
  memberships: StoredMembership[] = [
    {
      id: "membership-owner",
      userId: "owner-1",
      organizationId: "organization-1",
      role: Role.OWNER
    },
    {
      id: "membership-mod",
      userId: "moderator-1",
      organizationId: "organization-1",
      role: Role.MODERATOR
    },
    {
      id: "membership-viewer",
      userId: "viewer-1",
      organizationId: "organization-1",
      role: Role.VIEWER
    },
    {
      id: "membership-reporter",
      userId: "reporter-1",
      organizationId: "organization-1",
      role: Role.VIEWER
    },
    {
      id: "membership-other-tenant",
      userId: "other-tenant-user-1",
      organizationId: "organization-2",
      role: Role.VIEWER
    }
  ];

  contentItems: StoredContentItem[] = [
    {
      id: "content-1",
      organizationId: "organization-1",
      authorUserId: "viewer-1",
      type: ContentType.POST,
      title: "Reported post",
      body: "A post that can be reported",
      externalId: null,
      isHidden: false,
      createdAt: new Date("2026-06-08T00:00:00.000Z"),
      updatedAt: new Date("2026-06-08T00:00:00.000Z")
    },
    {
      id: "content-2",
      organizationId: "organization-2",
      authorUserId: "other-tenant-user-1",
      type: ContentType.POST,
      title: "Other tenant post",
      body: "A post from another tenant",
      externalId: null,
      isHidden: false,
      createdAt: new Date("2026-06-08T00:00:00.000Z"),
      updatedAt: new Date("2026-06-08T00:00:00.000Z")
    }
  ];

  reports: StoredReport[] = [];
  reportEvents: StoredReportEvent[] = [];
  internalNotes: StoredInternalNote[] = [];
  moderationActions: StoredModerationAction[] = [];
  auditLogs: StoredAuditLog[] = [];

  membership = {
    findMany: async ({
      where
    }: {
      where: {
        userId: string;
        role?: { in: Role[] };
      };
      select?: { organizationId: boolean };
    }) =>
      this.memberships
        .filter(
          (membership) =>
            membership.userId === where.userId &&
            (!where.role || where.role.in.includes(membership.role))
        )
        .map((membership) => ({
          organizationId: membership.organizationId
        })),
    findFirst: async ({
      where
    }: {
      where: {
        userId: string;
        organizationId: string;
        role?: { in: Role[] };
      };
      select?: { id: boolean };
    }) => {
      const membership = this.memberships.find(
        (storedMembership) =>
          storedMembership.userId === where.userId &&
          storedMembership.organizationId === where.organizationId &&
          (!where.role || where.role.in.includes(storedMembership.role))
      );

      return membership ? { id: membership.id, role: membership.role } : null;
    },
    findUnique: async ({
      where
    }: {
      where: {
        userId_organizationId: {
          userId: string;
          organizationId: string;
        };
      };
      select?: { id?: boolean; role?: boolean };
    }) => {
      const membership = this.memberships.find(
        (storedMembership) =>
          storedMembership.userId === where.userId_organizationId.userId &&
          storedMembership.organizationId ===
            where.userId_organizationId.organizationId
      );

      return membership ? { id: membership.id, role: membership.role } : null;
    }
  };

  contentItem = {
    findUnique: async ({ where }: { where: { id: string }; select?: unknown }) =>
      this.contentItems.find((contentItem) => contentItem.id === where.id) ??
      null,
    update: async ({
      where,
      data
    }: {
      where: { id: string };
      data: Partial<Pick<StoredContentItem, "isHidden" | "updatedAt">>;
    }) => {
      const contentItem = this.contentItems.find(
        (storedContentItem) => storedContentItem.id === where.id
      );

      if (!contentItem) {
        throw new Error("Content item not found");
      }

      Object.assign(contentItem, data, { updatedAt: new Date() });
      return contentItem;
    }
  };

  report = {
    create: async ({
      data
    }: {
      data: Omit<
        StoredReport,
        "id" | "status" | "createdAt" | "updatedAt" | "resolvedAt"
      > & {
        assignedModeratorId?: string | null;
        status?: ReportStatus;
        severity?: ReportSeverity;
      };
      include?: unknown;
    }) => {
      if (
        this.reports.some(
          (report) =>
            report.contentItemId === data.contentItemId &&
            report.reporterUserId === data.reporterUserId
        )
      ) {
        const error = new Error("Unique constraint failed");
        Object.assign(error, { code: "P2002" });
        throw error;
      }

      const now = new Date();
      const report: StoredReport = {
        id: `report-${this.reports.length + 1}`,
        organizationId: data.organizationId,
        contentItemId: data.contentItemId,
        reporterUserId: data.reporterUserId,
        assignedModeratorId: data.assignedModeratorId ?? null,
        reason: data.reason,
        status: data.status ?? ReportStatus.OPEN,
        severity: data.severity ?? ReportSeverity.LOW,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null
      };

      this.reports.push(report);
      return this.hydrateReport(report);
    },
    findMany: async ({
      where
    }: {
      where: {
        organizationId?: { in: string[] };
        status?: ReportStatus;
        reason?: ReportReason;
        severity?: ReportSeverity;
        assignedModeratorId?: string;
      };
      take?: number;
      include?: unknown;
    }) =>
      this.reports
        .filter((report) => {
          const organizationMatches =
            !where.organizationId ||
            where.organizationId.in.includes(report.organizationId);

          return (
            organizationMatches &&
            (!where.status || report.status === where.status) &&
            (!where.reason || report.reason === where.reason) &&
            (!where.severity || report.severity === where.severity) &&
            (!where.assignedModeratorId ||
              report.assignedModeratorId === where.assignedModeratorId)
          );
        })
        .map((report) => this.hydrateReport(report)),
    findUnique: async ({
      where
    }: {
      where: { id: string };
      select?: unknown;
      include?: unknown;
    }) => {
      const report = this.reports.find(
        (storedReport) => storedReport.id === where.id
      );

      return report ? this.hydrateReport(report) : null;
    },
    update: async ({
      where,
      data
    }: {
      where: { id: string };
      data: Partial<
        Pick<
          StoredReport,
          "assignedModeratorId" | "status" | "resolvedAt" | "updatedAt"
        >
      >;
      include?: unknown;
    }) => {
      const report = this.reports.find(
        (storedReport) => storedReport.id === where.id
      );

      if (!report) {
        throw new Error("Report not found");
      }

      Object.assign(report, data, { updatedAt: new Date() });
      return this.hydrateReport(report);
    }
  };

  reportEvent = {
    create: async ({ data }: { data: Omit<StoredReportEvent, "id" | "createdAt"> }) => {
      const event: StoredReportEvent = {
        id: `event-${this.reportEvents.length + 1}`,
        createdAt: new Date(),
        ...data
      };

      this.reportEvents.push(event);
      return event;
    }
  };

  internalNote = {
    create: async ({ data }: { data: Omit<StoredInternalNote, "id" | "createdAt"> }) => {
      const note: StoredInternalNote = {
        id: `note-${this.internalNotes.length + 1}`,
        createdAt: new Date(),
        ...data
      };

      this.internalNotes.push(note);
      return note;
    }
  };

  moderationAction = {
    create: async ({
      data
    }: {
      data: Omit<StoredModerationAction, "id" | "createdAt">;
    }) => {
      const action: StoredModerationAction = {
        id: `action-${this.moderationActions.length + 1}`,
        createdAt: new Date(),
        ...data,
        details: data.details ?? null
      };

      this.moderationActions.push(action);
      return action;
    }
  };

  auditLog = {
    create: async ({ data }: { data: Omit<StoredAuditLog, "id" | "createdAt"> }) => {
      const auditLog: StoredAuditLog = {
        id: `audit-${this.auditLogs.length + 1}`,
        createdAt: new Date(),
        ...data
      };

      this.auditLogs.push(auditLog);
      return auditLog;
    },
    findMany: async ({
      where
    }: {
      where: {
        organizationId?: { in: string[] };
        actorUserId?: string;
        entityType?: string;
      };
      take?: number;
      include?: unknown;
    }) =>
      this.auditLogs.filter((auditLog) => {
        const organizationMatches =
          !where.organizationId ||
          where.organizationId.in.includes(auditLog.organizationId);

        return (
          organizationMatches &&
          (!where.actorUserId || auditLog.actorUserId === where.actorUserId) &&
          (!where.entityType || auditLog.entityType === where.entityType)
        );
      })
  };

  async $transaction<T>(callback: (prisma: ModerationPrisma) => Promise<T>) {
    return callback(this);
  }

  private hydrateReport(report: StoredReport) {
    const contentItem = this.contentItems.find(
      (content) => content.id === report.contentItemId
    );

    return {
      ...report,
      contentItem,
      reporter: { id: report.reporterUserId },
      assignedModerator: report.assignedModeratorId
        ? { id: report.assignedModeratorId }
        : null,
      events: this.reportEvents.filter((event) => event.reportId === report.id),
      internalNotes: this.internalNotes.filter(
        (note) => note.reportId === report.id
      ),
      moderationActions: this.moderationActions.filter(
        (action) => action.reportId === report.id
      )
    };
  }
}

function createServices() {
  const prisma = new ModerationPrisma();
  const prismaService = prisma as unknown as PrismaService;
  const access = new ModerationAccessService(prismaService);

  return {
    prisma,
    reportsService: new ReportsService(prismaService),
    adminReportsService: new AdminReportsService(prismaService, access),
    auditLogsService: new AuditLogsService(prismaService, access)
  };
}

describe("Core moderation workflow", () => {
  it("creates a report and records the initial report event", async () => {
    const { prisma, reportsService } = createServices();

    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.SPAM,
      severity: ReportSeverity.MEDIUM,
      description: "Repeated promotional content"
    });

    expect(report).toMatchObject({
      contentItemId: "content-1",
      reporterUserId: "reporter-1",
      status: ReportStatus.OPEN,
      reason: ReportReason.SPAM
    });
    expect(prisma.reportEvents).toHaveLength(1);
    expect(prisma.reportEvents[0]).toMatchObject({
      reportId: report.id,
      toStatus: ReportStatus.OPEN
    });
  });

  it("prevents duplicate reports for the same content and reporter", async () => {
    const { reportsService } = createServices();

    await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.SPAM
    });

    await expect(
      reportsService.create("reporter-1", {
        contentItemId: "content-1",
        reason: ReportReason.HARASSMENT
      })
    ).rejects.toThrow("You have already reported this content");
  });

  it("prevents users from reporting their own content", async () => {
    const { reportsService } = createServices();

    await expect(
      reportsService.create("viewer-1", {
        contentItemId: "content-1",
        reason: ReportReason.OTHER
      })
    ).rejects.toThrow("Users cannot report their own content");
  });

  it("prevents users from reporting content in another tenant", async () => {
    const { reportsService } = createServices();

    await expect(
      reportsService.create("reporter-1", {
        contentItemId: "content-2",
        reason: ReportReason.SPAM
      })
    ).rejects.toThrow(
      "Users can only report content in organizations they belong to"
    );
  });

  it("blocks viewers from the moderator queue", async () => {
    const { adminReportsService } = createServices();

    await expect(adminReportsService.findMany("viewer-1", {})).rejects.toThrow(
      "Moderator access is required"
    );
  });

  it("assigns a report and writes audit and status event records", async () => {
    const { prisma, reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.SPAM
    });

    const assigned = await adminReportsService.assign("owner-1", report.id, {
      moderatorUserId: "moderator-1"
    });

    expect(assigned).toMatchObject({
      assignedModeratorId: "moderator-1",
      status: ReportStatus.IN_REVIEW
    });
    expect(prisma.reportEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromStatus: ReportStatus.OPEN,
          toStatus: ReportStatus.IN_REVIEW
        })
      ])
    );
    expect(prisma.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "REPORT_ASSIGNED",
          entityId: report.id
        })
      ])
    );
  });

  it("adds internal moderator notes and audit logs", async () => {
    const { prisma, reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.HARASSMENT
    });

    const note = await adminReportsService.addNote("moderator-1", report.id, {
      body: "Asked for a second review."
    });

    expect(note).toMatchObject({
      reportId: report.id,
      authorUserId: "moderator-1",
      body: "Asked for a second review."
    });
    expect(prisma.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "INTERNAL_NOTE_CREATED",
          entityId: note.id
        })
      ])
    );
  });

  it("hides content and returns the resolved report with action, event, and audit log", async () => {
    const { prisma, reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.VIOLENCE
    });
    await adminReportsService.assign("owner-1", report.id, {
      moderatorUserId: "moderator-1"
    });

    const updatedReport = await adminReportsService.takeAction(
      "moderator-1",
      report.id,
      {
        actionType: ModerationActionType.HIDE_CONTENT,
        reason: "Confirmed spam content."
      }
    );

    expect(updatedReport).toMatchObject({
      id: report.id,
      status: ReportStatus.RESOLVED,
      resolvedAt: expect.any(Date),
      contentItem: expect.objectContaining({
        id: "content-1",
        isHidden: true
      }),
      moderationActions: [
        expect.objectContaining({
          reportId: report.id,
          actionType: ModerationActionType.HIDE_CONTENT,
          reason: "Confirmed spam content."
        })
      ],
      events: expect.arrayContaining([
        expect.objectContaining({
          reportId: report.id,
          fromStatus: ReportStatus.IN_REVIEW,
          toStatus: ReportStatus.RESOLVED,
          message: "Confirmed spam content."
        })
      ])
    });
    expect(prisma.contentItems[0].isHidden).toBe(true);
    expect(prisma.moderationActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportId: report.id,
          actionType: ModerationActionType.HIDE_CONTENT,
          details: "Confirmed spam content."
        })
      ])
    );
    expect(updatedReport.moderationActions[0]).not.toHaveProperty("details");
    expect(prisma.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "MODERATION_ACTION_CREATED",
          entityType: "ModerationAction",
          metadata: {
            reportId: report.id,
            actionType: ModerationActionType.HIDE_CONTENT
          }
        })
      ])
    );
  });

  it("allows escalation from a non-terminal report", async () => {
    const { prisma, reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.HATE_SPEECH
    });

    const escalatedReport = await adminReportsService.takeAction(
      "moderator-1",
      report.id,
      {
        actionType: ModerationActionType.ESCALATE_REPORT,
        reason: "Needs owner review."
      }
    );

    expect(escalatedReport).toMatchObject({
      id: report.id,
      status: ReportStatus.ESCALATED,
      resolvedAt: null
    });
    expect(prisma.reportEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromStatus: ReportStatus.OPEN,
          toStatus: ReportStatus.ESCALATED
        })
      ])
    );
  });

  it("rejects new actions on terminal reports without clearing resolvedAt", async () => {
    const { prisma, reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.VIOLENCE
    });

    const resolvedReport = await adminReportsService.takeAction(
      "moderator-1",
      report.id,
      {
        actionType: ModerationActionType.WARN_USER,
        reason: "Warned the author."
      }
    );
    const resolvedAt = resolvedReport.resolvedAt;
    const actionCount = prisma.moderationActions.length;
    const eventCount = prisma.reportEvents.length;
    const auditLogCount = prisma.auditLogs.length;

    await expect(
      adminReportsService.takeAction("moderator-1", report.id, {
        actionType: ModerationActionType.ESCALATE_REPORT,
        reason: "Should not reopen terminal report."
      })
    ).rejects.toThrow("Terminal reports cannot receive new actions");

    expect(prisma.moderationActions).toHaveLength(actionCount);
    expect(prisma.reportEvents).toHaveLength(eventCount);
    expect(prisma.auditLogs).toHaveLength(auditLogCount);
    expect(prisma.reports[0]).toMatchObject({
      status: ReportStatus.RESOLVED,
      resolvedAt
    });
  });

  it("rejects new actions on dismissed reports", async () => {
    const { reportsService, adminReportsService } = createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.OTHER
    });

    await adminReportsService.takeAction("moderator-1", report.id, {
      actionType: ModerationActionType.NO_ACTION,
      reason: "No violation found."
    });

    await expect(
      adminReportsService.takeAction("moderator-1", report.id, {
        actionType: ModerationActionType.HIDE_CONTENT,
        reason: "Too late."
      })
    ).rejects.toThrow("Terminal reports cannot receive new actions");
  });

  it("lists audit logs for moderator-accessible organizations", async () => {
    const { reportsService, adminReportsService, auditLogsService } =
      createServices();
    const report = await reportsService.create("reporter-1", {
      contentItemId: "content-1",
      reason: ReportReason.SPAM
    });
    await adminReportsService.assign("owner-1", report.id, {
      moderatorUserId: "moderator-1"
    });

    const auditLogs = await auditLogsService.findMany("moderator-1", {});

    expect(auditLogs.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "REPORT_ASSIGNED",
          organizationId: "organization-1"
        })
      ])
    );
  });
});

describe("TakeModerationActionDto validation", () => {
  const metadata: ArgumentMetadata = {
    type: "body",
    metatype: TakeModerationActionDto
  };

  it("accepts optional reason", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });

    await expect(
      pipe.transform(
        {
          actionType: ModerationActionType.HIDE_CONTENT,
          reason: "Confirmed spam content."
        },
        metadata
      )
    ).resolves.toMatchObject({
      actionType: ModerationActionType.HIDE_CONTENT,
      reason: "Confirmed spam content."
    });
  });

  it("rejects an unknown notes property", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });

    await expect(
      pipe.transform(
        {
          actionType: ModerationActionType.HIDE_CONTENT,
          notes: "This should not be accepted."
        },
        metadata
      )
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(["property notes should not exist"])
      }
    });
  });

  it("rejects the old details property", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });

    await expect(
      pipe.transform(
        {
          actionType: ModerationActionType.HIDE_CONTENT,
          details: "Use reason instead."
        },
        metadata
      )
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(["property details should not exist"])
      }
    });
  });
});
