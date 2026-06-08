import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateMembershipDto } from "./dto/create-membership.dto";
import { MembershipsService } from "./memberships.service";

@Controller("memberships")
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Get("organizations/:organizationId")
  findByOrganization(@Param("organizationId") organizationId: string) {
    return this.membershipsService.findByOrganization(organizationId);
  }

  @Get("users/:userId")
  findByUser(@Param("userId") userId: string) {
    return this.membershipsService.findByUser(userId);
  }
}
