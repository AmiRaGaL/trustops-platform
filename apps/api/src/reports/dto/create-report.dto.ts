import { ReportReason, ReportSeverity } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateReportDto {
  @IsString()
  contentItemId!: string;

  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsEnum(ReportSeverity)
  @IsOptional()
  severity?: ReportSeverity;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;
}
