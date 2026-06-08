import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { MembershipsModule } from "./memberships/memberships.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

const envFilePath = [
  resolve(process.cwd(), "apps/api/.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../apps/api/.env"),
  resolve(process.cwd(), "../../.env")
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    AuthModule
  ]
})
export class AppModule {}
