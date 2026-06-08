import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: dto
    });
  }

  findMany() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id }
    });
  }
}
