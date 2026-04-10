import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { ConflictException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppConfigService } from "src/config/AppConfigService"
import { InstanceConfigService } from "./instance-config.service"
import { EnvironmentVariables } from "src/config/types"
import { ServerSourcesService } from "./server-sources.service"

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
    )

    expect(persistedConfigRaw).toEqual({
      version: 1,
      serverSync: {
        enabled: false,
        credentials: null,
        sources: [
          {
            id: source.id,
            name: "Main library",
            path: sourceDirectory,
            enabled: true,
          },
        ],
      },
      showDisabledPlugins: true,
    })
    expect(persistedConfigRaw).not.toHaveProperty(
      "microsoftApplicationClientId",
    )
    expect(persistedConfigRaw).not.toHaveProperty("oneDrive")
    expect(persistedConfigRaw).not.toHaveProperty(
      "microsoftApplicationAuthority",
    )
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

  it("rejects unknown nested microsoft config properties", async () => {
    const { appConfig, instanceConfigService } = await createServices()

    await fs.promises.writeFile(
      appConfig.CONFIG_FILE,
      JSON.stringify(
        {
          version: 1,
          serverSync: {
            enabled: false,
            credentials: null,
            sources: [],
          },
          oneDrive: {
            applicationClientId: "legacy-client-id",
            applicationAuthority:
              "https://login.microsoftonline.com/legacy-tenant",
          },
          showDisabledPlugins: true,
        },
        null,
        2,
      ),
      "utf8",
    )

    await expect(instanceConfigService.getConfig()).rejects.toThrow(
      "Invalid instance config file",
    )
  })

  it("accepts an empty microsoft authority string", async () => {
    const { appConfig, instanceConfigService } = await createServices()

    await fs.promises.writeFile(
      appConfig.CONFIG_FILE,
      JSON.stringify(
        {
          version: 1,
          serverSync: {
            enabled: false,
            credentials: null,
            sources: [],
          },
          microsoftApplicationAuthority: "",
          showDisabledPlugins: true,
        },
        null,
        2,
      ),
      "utf8",
    )

    await expect(instanceConfigService.getConfig()).resolves.toMatchObject({
      microsoftApplicationAuthority: "",
    })
  })
})
