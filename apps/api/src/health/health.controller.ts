import { Controller, Get } from "@nestjs/common";

type HealthResponse = {
  status: "ok";
  service: "trustops-api";
};

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: "ok",
      service: "trustops-api"
    };
  }
}
