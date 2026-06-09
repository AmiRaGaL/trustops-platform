import { ConfigService } from "@nestjs/config";

export function getRequiredConfig(
  configService: ConfigService,
  key: string
): string {
  const value = configService.get<string>(key);

  if (!value || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value;
}
