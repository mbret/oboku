import "./instrument"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./config/types"
import { Logger, ValidationPipe } from "@nestjs/common"
import path from "node:path"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<EnvironmentVariables>)
  const logger = new Logger("Bootstrap")

  logger.log(
    `API_DATA_DIR: ${path.resolve(configService.getOrThrow("API_DATA_DIR"))}`,
  )
  logger.log(
    `API_CONFIG_DIR: ${path.resolve(configService.getOrThrow("API_CONFIG_DIR"))}`,
  )

  app.useGlobalPipes(new ValidationPipe())
  app.enableCors({
    origin: "*",
  })

  await app.listen(configService.getOrThrow("PORT"))
}

bootstrap()
