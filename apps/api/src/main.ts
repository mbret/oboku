import "./instrument"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./config/types"
import { Logger, ValidationPipe } from "@nestjs/common"
import { json, urlencoded } from "express"
import path from "node:path"
import { WebDavService } from "./webdav/webdav.service"
import { CouchProxyService } from "./couch/couch-proxy.service"

async function bootstrap() {
  // Disable the global body parser so we can mount the raw-stream proxies
  // (CouchDB, WebDAV) before it and re-add it for the rest of the API below.
  const app = await NestFactory.create(AppModule, { bodyParser: false })

  const configService = app.get(ConfigService<EnvironmentVariables>)
  const logger = new Logger("Bootstrap")

  logger.log(
    `API_DATA_DIR: ${path.resolve(configService.getOrThrow("API_DATA_DIR"))}`,
  )
  logger.log(
    `API_CONFIG_DIR: ${path.resolve(configService.getOrThrow("API_CONFIG_DIR"))}`,
  )

  // Mount the streaming proxies BEFORE body parsing so request bodies stream
  // through untouched (large CouchDB _bulk_docs, binary attachments, etc.).
  // These middlewares fully handle their requests and never call next().
  const webDavService = app.get(WebDavService)
  app.use("/webdav", webDavService.middleware)

  const couchProxyService = app.get(CouchProxyService)
  app.use("/couchdb", couchProxyService.middleware)

  // Re-add the body parsers (disabled above) for the rest of the API.
  app.use(json())
  app.use(urlencoded({ extended: true }))

  app.useGlobalPipes(new ValidationPipe())
  app.enableCors({
    origin: "*",
  })

  await app.listen(configService.getOrThrow("PORT"))
}

bootstrap()
