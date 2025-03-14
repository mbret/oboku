import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<EnvironmentVariables>)

  app.enableCors({
    origin: "*",
  })

  await app.listen(configService.getOrThrow("PORT"))
}

bootstrap()
