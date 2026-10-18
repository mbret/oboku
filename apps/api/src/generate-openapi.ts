import { writeFile } from "node:fs/promises"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

/**
 * `AppModule` validates the environment as soon as it is imported, so these
 * must be set before the dynamic imports below. Building the document reads
 * none of them.
 */
const placeholderEnvironment = {
  POSTGRES_PASSWORD: "unused",
  API_DATA_DIR: "unused",
  API_CONFIG_DIR: "unused",
  APP_PUBLIC_URL: "http://localhost",
  JWT_PRIVATE_KEY: "unused",
  JWT_PUBLIC_KEY: "unused",
}

for (const [name, value] of Object.entries(placeholderEnvironment)) {
  process.env[name] ??= value
}

const { AppModule } = await import("./app.module.js")
const { AuthModule } = await import("./auth/auth.module.js")
const { BooksModule } = await import("./books/books.module.js")
const { CollectionsModule } = await import(
  "./features/collections/collections.module.js"
)
const { DataSourceModule } = await import("./datasource/datasource.module.js")
const { KoreaderSyncConnectionModule } = await import(
  "./koreader/sync-connection/koreader-sync-connection.module.js"
)
const { KoreaderSyncServerModule } = await import(
  "./koreader/sync-server/koreader-sync-server.module.js"
)
const { NotificationsModule } = await import(
  "./notifications/notifications.module.js"
)

// TODO: drop `include` once every controller keeps its DTOs in `*.dto.ts`
// and returns classes, so the document covers the whole API.
const documentedModules = [
  AppModule,
  AuthModule,
  BooksModule,
  CollectionsModule,
  DataSourceModule,
  KoreaderSyncConnectionModule,
  KoreaderSyncServerModule,
  NotificationsModule,
]

const app = await NestFactory.create(AppModule, {
  preview: true,
  logger: false,
  abortOnError: false,
})

const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder().setTitle("oboku API").build(),
  {
    include: documentedModules,
    operationIdFactory: function toOperationId(controllerKey, methodKey) {
      return `${controllerKey.replace(/Controller$/, "")}_${methodKey}`
    },
  },
)

await writeFile(
  new URL("./openapi.json", import.meta.url),
  `${JSON.stringify(document, null, 2)}\n`,
)

await app.close()
