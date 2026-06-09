import { ForbiddenException, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const MODERATION_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MODERATOR];

@Injectable()
export class ModerationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async findModeratedOrganizationIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        role: {
          in: MODERATION_ROLES
        }
      },
      select: {
        organizationId: true
      }
    });

    return memberships.map((membership) => membership.organizationId);
  }

  async assertCanModerateOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
        role: {
          in: MODERATION_ROLES
        }
      },
      select: {
        id: true
      }
    });

    if (!membership) {
      throw new ForbiddenException("Moderator access is required");
    }
  }
}
