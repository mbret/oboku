import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { ConflictException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppConfigService } from "src/config/AppConfigService"
import { InstanceConfigService } from "./instance-config.service"
import { EnvironmentVariables } from "src/config/types"
import { ServerSourcesService } from "./server-sources.service"

const isPersistedConfig = (
  value: unknown,
): value is {
  version: number
  serverSources: Array<{ id: string; path: string }>
} => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  if (!("version" in value) || !("serverSources" in value)) {
    return false
  }

  if (
    !Array.isArray(value.serverSources) ||
    typeof value.version !== "number"
  ) {
    return false
  }

  return value.serverSources.every((source) => {
    return (
      typeof source === "object" &&
      source !== null &&
      "id" in source &&
      typeof source.id === "string" &&
      "path" in source &&
      typeof source.path === "string"
    )
  })
}

describe("InstanceConfigService server sources", () => {
  const createdDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(
      createdDirectories
        .splice(0)
        .map((directory) =>
          fs.promises.rm(directory, { recursive: true, force: true }),
        ),
    )
  })

  const createServices = async () => {
    const rootDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "oboku-server-sources-"),
    )
    const sourceDirectory = path.join(rootDir, "library")

    createdDirectories.push(rootDir)
    await fs.promises.mkdir(sourceDirectory, { recursive: true })

    const env: EnvironmentVariables = {
      NODE_ENV: "development",
      PORT: 3000,
      COUCH_DB_URL: "http://localhost:5984",
      GOOGLE_BOOK_API_URL: "https://www.googleapis.com/books/v1",
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      JWT_PRIVATE_KEY_FILE: "/tmp/private.pem",
      API_DATA_DIR: "/tmp/oboku-data",
      API_CONFIG_DIR: rootDir,
      COVERS_STORAGE_STRATEGY: "fs",
      APP_PUBLIC_URL: "http://localhost",
    }
    const appConfig = new AppConfigService(
      new ConfigService<EnvironmentVariables>(env),
    )
    const serverSourcesService = new ServerSourcesService()
    const instanceConfigService = new InstanceConfigService(
      appConfig,
      serverSourcesService,
    )
    await instanceConfigService.onModuleInit()

    return {
      appConfig,
      sourceDirectory,
      instanceConfigService,
    }
  }

  it("creates the config file on startup and persists created sources", async () => {
    const { appConfig, sourceDirectory, instanceConfigService } =
      await createServices()

    const source = await instanceConfigService.createServerSource({
      name: "Main library",
      path: sourceDirectory,
      enabled: true,
    })

    const persistedConfigRaw = JSON.parse(
      await fs.promises.readFile(appConfig.CONFIG_FILE, "utf8"),
    ) as unknown

    if (!isPersistedConfig(persistedConfigRaw)) {
      throw new Error("Persisted config has an unexpected shape")
    }

    expect(persistedConfigRaw.version).toBe(1)
    expect(persistedConfigRaw.serverSources).toHaveLength(1)
    expect(persistedConfigRaw.serverSources[0]?.id).toBe(source.id)
    expect(persistedConfigRaw.serverSources[0]?.path).toBe(sourceDirectory)
  })

  it("rejects duplicate normalized paths", async () => {
    const { sourceDirectory, instanceConfigService } = await createServices()

    await instanceConfigService.createServerSource({
      name: "Main library",
      path: sourceDirectory,
      enabled: true,
    })

    await expect(
      instanceConfigService.createServerSource({
        name: "Duplicate library",
        path: `${sourceDirectory}/`,
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
