import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthResponse, AuthUser, RegisterResponse } from "./types";

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const slug = await this.generateOrganizationSlug(
          dto.organizationName,
          prisma
        );

        const user = await prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            name: dto.name,
            passwordHash
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
          }
        });

        const organization = await prisma.organization.create({
          data: {
            name: dto.organizationName,
            slug
          },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true
          }
        });

        const membership = await prisma.membership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: Role.OWNER
          },
          select: {
            role: true
          }
        });

        return {
          user,
          organization,
          membershipRole: membership.role
        };
      });

      return {
        ...this.withToken(result.user),
        organization: result.organization,
        membershipRole: result.membershipRole
      };
    } catch (error) {
      if (this.isPrismaKnownError(error, "P2002")) {
        throw new ConflictException("Email is already registered");
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const userWithPassword = await this.usersService.findByEmail(dto.email);

    if (!userWithPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      userWithPassword.passwordHash
    );

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.withToken(this.toAuthUser(userWithPassword));
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException("Authenticated user no longer exists");
    }

    return user;
  }

  private withToken(user: AuthUser): AuthResponse {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email
    });

    return {
      accessToken,
      user
    };
  }

  private toAuthUser(user: AuthUser & { passwordHash: string }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async generateOrganizationSlug(
    organizationName: string,
    prisma: Prisma.TransactionClient
  ): Promise<string> {
    const baseSlug = this.slugify(organizationName);
    let slug = baseSlug;
    let suffix = 2;

    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "organization";
  }

  private isPrismaKnownError(error: unknown, code: string): boolean {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === code) ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code)
    );
  }
}
