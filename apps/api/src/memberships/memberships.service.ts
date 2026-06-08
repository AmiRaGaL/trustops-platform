import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMembershipDto } from "./dto/create-membership.dto";

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMembershipDto) {
    return this.prisma.membership.create({
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        organization: true
      }
    });
  }

  findByOrganization(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  findByUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: {
        organization: true
      },
      orderBy: { createdAt: "asc" }
    });
  }
}
