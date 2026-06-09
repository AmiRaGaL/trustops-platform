import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard)
export class AdminAuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findMany(@CurrentUser() user: JwtUser, @Query() dto: ListAuditLogsDto) {
    return this.auditLogsService.findMany(user.sub, dto);
  }
}
