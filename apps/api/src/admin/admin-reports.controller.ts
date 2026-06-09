import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AdminReportsService } from "./admin-reports.service";
import { AddInternalNoteDto } from "./dto/add-internal-note.dto";
import { AssignReportDto } from "./dto/assign-report.dto";
import { ListAdminReportsDto } from "./dto/list-admin-reports.dto";
import { TakeModerationActionDto } from "./dto/take-moderation-action.dto";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  findMany(@CurrentUser() user: JwtUser, @Query() dto: ListAdminReportsDto) {
    return this.adminReportsService.findMany(user.sub, dto);
  }

  @Get(":id")
  findById(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.adminReportsService.findById(user.sub, id);
  }

  @Post(":id/assign")
  assign(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: AssignReportDto
  ) {
    return this.adminReportsService.assign(user.sub, id, dto);
  }

  @Post(":id/notes")
  addNote(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: AddInternalNoteDto
  ) {
    return this.adminReportsService.addNote(user.sub, id, dto);
  }

  @Post(":id/actions")
  takeAction(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: TakeModerationActionDto
  ) {
    return this.adminReportsService.takeAction(user.sub, id, dto);
  }

  @Post(":id/escalate")
  escalate(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.adminReportsService.escalate(user.sub, id);
  }
}
