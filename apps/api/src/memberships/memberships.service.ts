import { ForbiddenException, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMembershipDto } from "./dto/create-membership.dto";

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorUserId: string, dto: CreateMembershipDto) {
    const actorMembership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: actorUserId,
          organizationId: dto.organizationId
        }
      },
      select: {
        role: true
      }
    });

    if (!actorMembership) {
      throw new ForbiddenException(
        "Cannot create memberships for organizations you do not belong to"
      );
    }

    if (
      actorMembership.role !== Role.OWNER &&
      actorMembership.role !== Role.ADMIN
    ) {
      throw new ForbiddenException("OWNER or ADMIN role is required");
    }

    if (dto.role === Role.OWNER && actorMembership.role !== Role.OWNER) {
      throw new ForbiddenException("Only OWNER members can grant OWNER role");
    }

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
