import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ListAuditLogsDto } from "../admin/dto/list-audit-logs.dto";
import { ModerationAccessService } from "../moderation/moderation-access.service";
import { PrismaService } from "../prisma/prisma.service";

const AUDIT_LOG_PAGE_SIZE = 50;

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ModerationAccessService
  ) {}

  async findMany(actorUserId: string, dto: ListAuditLogsDto) {
    const organizationIds =
      await this.access.findModeratedOrganizationIds(actorUserId);

    if (organizationIds.length === 0) {
      throw new ForbiddenException("Moderator access is required");
    }

    const where: Prisma.AuditLogWhereInput = {
      organizationId: { in: organizationIds },
      actorUserId: dto.actorUserId,
      entityType: dto.entityType
    };

    const logs = await this.prisma.auditLog.findMany({
      where,
      take: AUDIT_LOG_PAGE_SIZE + 1,
      ...(dto.cursor
        ? {
            cursor: { id: dto.cursor },
            skip: 1
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        organization: true
      }
    });

    const hasMore = logs.length > AUDIT_LOG_PAGE_SIZE;
    const data = hasMore ? logs.slice(0, AUDIT_LOG_PAGE_SIZE) : logs;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null
    };
  }
}
