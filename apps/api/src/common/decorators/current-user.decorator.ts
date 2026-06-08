import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { JwtUser } from "../../auth/types";

type RequestWithUser = Request & {
  user: JwtUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }
);
