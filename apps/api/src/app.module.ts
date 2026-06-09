import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { HealthModule } from "./health/health.module";
import { MembershipsModule } from "./memberships/memberships.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
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
      envFilePath,
      validate: (config: Record<string, unknown>) => {
        if (
          typeof config.JWT_SECRET !== "string" ||
          config.JWT_SECRET.trim().length === 0
        ) {
          throw new Error("JWT_SECRET is required");
        }

        return config;
      }
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    AuthModule,
    ContentModule,
    ReportsModule,
    AdminModule
  ]
})
export class AppModule {}
