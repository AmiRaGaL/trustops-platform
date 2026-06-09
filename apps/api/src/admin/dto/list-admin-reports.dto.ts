import { ReportReason, ReportSeverity, ReportStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListAdminReportsDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsEnum(ReportReason)
  @IsOptional()
  reason?: ReportReason;

  @IsEnum(ReportSeverity)
  @IsOptional()
  severity?: ReportSeverity;

  @IsString()
  @IsOptional()
  assignedModeratorId?: string;

  @IsString()
  @IsOptional()
  cursor?: string;
}
