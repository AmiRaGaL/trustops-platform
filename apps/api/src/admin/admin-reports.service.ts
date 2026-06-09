import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  ModerationActionType,
  Prisma,
  ReportStatus
} from "@prisma/client";
import { ModerationAccessService } from "../moderation/moderation-access.service";
import { PrismaService } from "../prisma/prisma.service";
import { AddInternalNoteDto } from "./dto/add-internal-note.dto";
import { AssignReportDto } from "./dto/assign-report.dto";
import { ListAdminReportsDto } from "./dto/list-admin-reports.dto";
import { TakeModerationActionDto } from "./dto/take-moderation-action.dto";

const REPORT_PAGE_SIZE = 20;

type ReportWithModerationDetails = Prisma.ReportGetPayload<{
  include: ReturnType<AdminReportsService["reportDetailIncludes"]>;
}>;

type ModerationActionResponse =
  ReportWithModerationDetails["moderationActions"][number] extends infer Action
    ? Omit<Action, "details"> & { reason: string | null }
    : never;

type ReportDetailResponse = Omit<
  ReportWithModerationDetails,
  "moderationActions"
> & {
  moderationActions: ModerationActionResponse[];
};

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ModerationAccessService
  ) {}

  async findMany(actorUserId: string, dto: ListAdminReportsDto) {
    const organizationIds = await this.findAccessibleOrganizations(actorUserId);
    const where: Prisma.ReportWhereInput = {
      organizationId: { in: organizationIds },
      status: dto.status,
      reason: dto.reason,
      severity: dto.severity,
      assignedModeratorId: dto.assignedModeratorId
    };

    const reports = await this.prisma.report.findMany({
      where,
      take: REPORT_PAGE_SIZE + 1,
      ...(dto.cursor
        ? {
            cursor: { id: dto.cursor },
            skip: 1
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: this.reportIncludes()
    });

    const hasMore = reports.length > REPORT_PAGE_SIZE;
    const data = hasMore ? reports.slice(0, REPORT_PAGE_SIZE) : reports;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null
    };
  }

  async findById(actorUserId: string, reportId: string) {
    const report = await this.getReportOrThrow(reportId);
    await this.access.assertCanModerateOrganization(
      actorUserId,
      report.organizationId
    );

    return this.prisma.report.findUnique({
      where: { id: reportId },
      include: this.reportDetailIncludes()
    }).then((report) => (report ? this.toReportDetailResponse(report) : null));
  }

  async assign(actorUserId: string, reportId: string, dto: AssignReportDto) {
    const report = await this.getReportOrThrow(reportId);
    await this.access.assertCanModerateOrganization(
      actorUserId,
      report.organizationId
    );
    await this.access.assertCanModerateOrganization(
      dto.moderatorUserId,
      report.organizationId
    );

    return this.prisma.$transaction(async (prisma) => {
      const nextStatus =
        report.status === ReportStatus.OPEN
          ? ReportStatus.IN_REVIEW
          : report.status;

      const updatedReport = await prisma.report.update({
        where: { id: report.id },
        data: {
          assignedModeratorId: dto.moderatorUserId,
          status: nextStatus
        },
        include: this.reportDetailIncludes()
      });

      if (nextStatus !== report.status) {
        await this.createReportEvent(prisma, {
          reportId: report.id,
          actorUserId,
          fromStatus: report.status,
          toStatus: nextStatus,
          message: "Report assigned for review"
        });
      }

      await this.createAuditLog(prisma, {
        organizationId: report.organizationId,
        actorUserId,
        action: "REPORT_ASSIGNED",
        entityType: "Report",
        entityId: report.id,
        metadata: {
          assignedModeratorId: dto.moderatorUserId
        }
      });

      return this.toReportDetailResponse(updatedReport);
    });
  }

  async addNote(actorUserId: string, reportId: string, dto: AddInternalNoteDto) {
    const report = await this.getReportOrThrow(reportId);
    await this.access.assertCanModerateOrganization(
      actorUserId,
      report.organizationId
    );

    return this.prisma.$transaction(async (prisma) => {
      const note = await prisma.internalNote.create({
        data: {
          reportId: report.id,
          authorUserId: actorUserId,
          body: dto.body
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      await this.createAuditLog(prisma, {
        organizationId: report.organizationId,
        actorUserId,
        action: "INTERNAL_NOTE_CREATED",
        entityType: "InternalNote",
        entityId: note.id,
        metadata: {
          reportId: report.id
        }
      });

      return note;
    });
  }

  async takeAction(
    actorUserId: string,
    reportId: string,
    dto: TakeModerationActionDto
  ) {
    const report = await this.getReportOrThrow(reportId);
    await this.access.assertCanModerateOrganization(
      actorUserId,
      report.organizationId
    );
    this.assertCanTakeAction(report.status);

    return this.prisma.$transaction(async (prisma) => {
      const action = await prisma.moderationAction.create({
        data: {
          reportId: report.id,
          actorUserId,
          actionType: dto.actionType,
          details: dto.reason
        }
      });

      const nextStatus = this.statusForAction(dto.actionType);
      const resolvedAt = this.isTerminalStatus(nextStatus) ? new Date() : null;

      if (dto.actionType === ModerationActionType.HIDE_CONTENT) {
        await prisma.contentItem.update({
          where: { id: report.contentItemId },
          data: {
            isHidden: true
          }
        });
      }

      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: nextStatus,
          resolvedAt
        }
      });

      await this.createReportEvent(prisma, {
        reportId: report.id,
        actorUserId,
        fromStatus: report.status,
        toStatus: nextStatus,
        message: dto.reason ?? `Moderation action: ${dto.actionType}`
      });

      await this.createAuditLog(prisma, {
        organizationId: report.organizationId,
        actorUserId,
        action: "MODERATION_ACTION_CREATED",
        entityType: "ModerationAction",
        entityId: action.id,
        metadata: {
          reportId: report.id,
          actionType: dto.actionType
        }
      });

      return this.findDetailedReportOrThrow(prisma, report.id);
    });
  }

  escalate(actorUserId: string, reportId: string) {
    return this.takeAction(actorUserId, reportId, {
      actionType: ModerationActionType.ESCALATE_REPORT,
      reason: "Report escalated"
    });
  }

  private async findAccessibleOrganizations(userId: string): Promise<string[]> {
    const organizationIds =
      await this.access.findModeratedOrganizationIds(userId);

    if (organizationIds.length === 0) {
      throw new ForbiddenException("Moderator access is required");
    }

    return organizationIds;
  }

  private async getReportOrThrow(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        organizationId: true,
        contentItemId: true,
        status: true
      }
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return report;
  }

  private statusForAction(actionType: ModerationActionType): ReportStatus {
    if (
      actionType === ModerationActionType.DISMISS_REPORT ||
      actionType === ModerationActionType.NO_ACTION
    ) {
      return ReportStatus.DISMISSED;
    }

    if (actionType === ModerationActionType.ESCALATE_REPORT) {
      return ReportStatus.ESCALATED;
    }

    return ReportStatus.RESOLVED;
  }

  private isTerminalStatus(status: ReportStatus): boolean {
    return status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED;
  }

  private assertCanTakeAction(status: ReportStatus): void {
    if (this.isTerminalStatus(status)) {
      throw new ConflictException("Terminal reports cannot receive new actions");
    }
  }

  private createReportEvent(
    prisma: Prisma.TransactionClient,
    data: Prisma.ReportEventUncheckedCreateInput
  ) {
    return prisma.reportEvent.create({ data });
  }

  private createAuditLog(
    prisma: Prisma.TransactionClient,
    data: Prisma.AuditLogUncheckedCreateInput
  ) {
    return prisma.auditLog.create({ data });
  }

  private async findDetailedReportOrThrow(
    prisma: Prisma.TransactionClient,
    reportId: string
  ): Promise<ReportDetailResponse> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: this.reportDetailIncludes()
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return this.toReportDetailResponse(report);
  }

  private toReportDetailResponse(
    report: ReportWithModerationDetails
  ): ReportDetailResponse {
    return {
      ...report,
      moderationActions: report.moderationActions.map(
        ({ details, ...action }) => ({
          ...action,
          reason: details
        })
      )
    };
  }

  private reportIncludes() {
    return {
      contentItem: {
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      },
      reporter: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      assignedModerator: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    };
  }

  private reportDetailIncludes() {
    return {
      ...this.reportIncludes(),
      events: {
        orderBy: { createdAt: "asc" as const },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      },
      internalNotes: {
        orderBy: { createdAt: "asc" as const },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      },
      moderationActions: {
        orderBy: { createdAt: "asc" as const },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }
    };
  }
}
