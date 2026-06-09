import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const DEFAULT_WEB_APP_ORIGIN = "http://localhost:3001";

function getWebAppOrigin(value: string | undefined): string {
  return value?.trim() || DEFAULT_WEB_APP_ORIGIN;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const webAppOrigin = getWebAppOrigin(
    configService.get<string>("WEB_APP_ORIGIN")
  );

  app.enableCors({
    origin: webAppOrigin,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const port = configService.get<number>("PORT", 3000);

  await app.listen(port);
}

void bootstrap();
