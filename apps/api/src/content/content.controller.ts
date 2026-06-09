import { Controller, Get, Param, Query } from "@nestjs/common";
import { ContentService } from "./content.service";
import { ListContentDto } from "./dto/list-content.dto";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findMany(@Query() dto: ListContentDto) {
    return this.contentService.findMany(dto);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.contentService.findById(id);
  }
}
