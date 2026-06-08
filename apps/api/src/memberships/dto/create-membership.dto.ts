import { Role } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class CreateMembershipDto {
  @IsString()
  userId!: string;

  @IsString()
  organizationId!: string;

  @IsEnum(Role)
  role!: Role;
}
