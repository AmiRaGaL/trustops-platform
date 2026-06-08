import { Role } from "@prisma/client";

export type JwtUser = {
  sub: string;
  email: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterResponse = AuthResponse & {
  organization: AuthOrganization;
  membershipRole: Role;
};
