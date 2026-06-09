import { Module } from "@nestjs/common";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ModerationAccessService } from "../moderation/moderation-access.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAuditLogsController } from "./admin-audit-logs.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminReportsService } from "./admin-reports.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminReportsController, AdminAuditLogsController],
  providers: [AdminReportsService, AuditLogsService, ModerationAccessService],
  exports: [AdminReportsService]
})
export class AdminModule {}
