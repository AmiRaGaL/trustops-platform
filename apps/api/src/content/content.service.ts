import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListContentDto } from "./dto/list-content.dto";

const CONTENT_PAGE_SIZE = 20;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(dto: ListContentDto) {
    const where: Prisma.ContentItemWhereInput = {
      organizationId: dto.organizationId,
      type: dto.type
    };

    const items = await this.prisma.contentItem.findMany({
      where,
      take: CONTENT_PAGE_SIZE + 1,
      ...(dto.cursor
        ? {
            cursor: { id: dto.cursor },
            skip: 1
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        organization: true
      }
    });

    const hasMore = items.length > CONTENT_PAGE_SIZE;
    const data = hasMore ? items.slice(0, CONTENT_PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null
    };
  }

  async findById(id: string) {
    const contentItem = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        organization: true
      }
    });

    if (!contentItem) {
      throw new NotFoundException("Content item not found");
    }

    return contentItem;
  }
}
