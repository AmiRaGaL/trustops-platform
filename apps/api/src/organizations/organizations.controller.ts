import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  findMany() {
    return this.organizationsService.findMany();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.organizationsService.findById(id);
  }
}
