import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtUser } from "../auth/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateMembershipDto } from "./dto/create-membership.dto";
import { MembershipsService } from "./memberships.service";

@Controller("memberships")
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(user.sub, dto);
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
