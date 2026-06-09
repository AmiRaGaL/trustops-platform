import { ContentType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ListContentDto {
  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  organizationId?: string;
}
