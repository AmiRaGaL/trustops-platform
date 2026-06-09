import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.sub, dto);
  }

  @Get("my")
  findMine(@CurrentUser() user: JwtUser) {
    return this.reportsService.findMine(user.sub);
  }
}
