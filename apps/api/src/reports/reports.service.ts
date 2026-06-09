import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, ReportSeverity, ReportStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto } from "./dto/create-report.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReportDto) {
    const contentItem = await this.prisma.contentItem.findUnique({
      where: { id: dto.contentItemId },
      select: {
        id: true,
        authorUserId: true,
        organizationId: true
      }
    });

    if (!contentItem) {
      throw new NotFoundException("Content item not found");
    }

    if (contentItem.authorUserId === userId) {
      throw new ForbiddenException("Users cannot report their own content");
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: contentItem.organizationId
        }
      },
      select: {
        id: true
      }
    });

    if (!membership) {
      throw new ForbiddenException(
        "Users can only report content in organizations they belong to"
      );
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const report = await prisma.report.create({
          data: {
            organizationId: contentItem.organizationId,
            contentItemId: contentItem.id,
            reporterUserId: userId,
            reason: dto.reason,
            severity: dto.severity ?? ReportSeverity.LOW,
            description: dto.description
          },
          include: this.reportIncludes()
        });

        await prisma.reportEvent.create({
          data: {
            reportId: report.id,
            actorUserId: userId,
            toStatus: ReportStatus.OPEN,
            message: "Report created"
          }
        });

        return report;
      });
    } catch (error) {
      if (this.isPrismaKnownError(error, "P2002")) {
        throw new ConflictException("You have already reported this content");
      }

      throw error;
    }
  }

  findMine(userId: string) {
    return this.prisma.report.findMany({
      where: {
        reporterUserId: userId
      },
      orderBy: { createdAt: "desc" },
      include: {
        contentItem: true
      }
    });
  }

  private reportIncludes() {
    return {
      contentItem: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    };
  }

  private isPrismaKnownError(error: unknown, code: string): boolean {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === code) ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code)
    );
  }
}
