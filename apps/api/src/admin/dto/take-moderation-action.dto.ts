import { ModerationActionType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class TakeModerationActionDto {
  @IsEnum(ModerationActionType)
  actionType!: ModerationActionType;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  reason?: string;
}
