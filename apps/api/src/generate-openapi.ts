import { writeFile } from "node:fs/promises"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

/**
 * `AppModule` validates the environment as soon as it is imported, so these
 * must be set before the dynamic import below. Building the document reads
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

const app = await NestFactory.create(AppModule, {
  preview: true,
  logger: false,
  abortOnError: false,
})

const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder()
    .setTitle("oboku API")
    .setOpenAPIVersion("3.1.0")
    .build(),
  {
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
