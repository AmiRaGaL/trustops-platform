import { IsOptional, IsString } from "class-validator";

export class ListAuditLogsDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  actorUserId?: string;

  @IsString()
  @IsOptional()
  entityType?: string;
}
