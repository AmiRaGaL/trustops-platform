import { IsString } from "class-validator";

export class AssignReportDto {
  @IsString()
  moderatorUserId!: string;
}
