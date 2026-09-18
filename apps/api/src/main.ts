import "./instrument"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./config/types"
import { Logger, ValidationPipe } from "@nestjs/common"
import cookieParser from "cookie-parser"
import { json, urlencoded } from "express"
import path from "node:path"
import { WebDavService } from "./webdav/webdav.service"
import { CouchProxyService } from "./couch/couch-proxy.service"
import { TrustedOriginsService } from "./config/trusted-origin.service"
import { createCsrfOriginMiddleware } from "./auth/csrf-origin.middleware"
import { createCorsOptionsDelegate } from "./config/cors-options"

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

  const trustedOriginsService = app.get(TrustedOriginsService)

  logger.log(
    `Browser origins — ${trustedOriginsService.originPolicyDescription}`,
  )

  // Cookie parsing must precede the proxy mounts so both the raw proxy
  // middlewares and the Nest guard see `req.cookies` (it never reads the
  // body, so mounting it before the body parsers is safe).
  app.use(cookieParser())
  app.use(createCsrfOriginMiddleware(trustedOriginsService))

  // Mount the streaming proxies BEFORE body parsing so request bodies stream
  // through untouched (large CouchDB _bulk_docs, binary attachments, etc.).
  // These middlewares fully handle their requests and never call next().
  const webDavService = app.get(WebDavService)
  app.use("/webdav", webDavService.middleware)

  const couchProxyService = app.get(CouchProxyService)
  app.use("/couchdb", couchProxyService.middleware)

  // CORS must be registered before the body parsers. express.json()/urlencoded()
  // reject a malformed or oversized body by throwing straight to Express's error
  // handler, bypassing every middleware registered after them — so with CORS
  // registered later those 400/413 responses (and any other pre-router failure)
  // would ship without `Access-Control-Allow-Origin`, and the browser masks the
  // real status as an opaque cross-origin error. Placed after the proxy mounts,
  // which terminate their own requests and own their CORS, so it never
  // double-handles them.
  //
  // The delegate form resolves the policy per request, which the static options
  // cannot: it only sees the origin, and `/admin` needs a different answer than
  // the cookie routes for the very same origin.
  app.enableCors(createCorsOptionsDelegate(trustedOriginsService))

  // Re-add the body parsers (disabled above) for the rest of the API.
  app.use(json())
  app.use(urlencoded({ extended: true }))

  app.useGlobalPipes(new ValidationPipe())

  await app.listen(configService.getOrThrow("PORT"))
}

bootstrap()
