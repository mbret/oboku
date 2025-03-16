import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"
import { ValidationPipe } from "@nestjs/common"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<EnvironmentVariables>)

  app.useGlobalPipes(new ValidationPipe())
  app.enableCors({
    origin: "*",
  })

  await app.listen(configService.getOrThrow("PORT"))
}

bootstrap()
