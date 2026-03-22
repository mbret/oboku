import { Inject, Injectable, OnModuleInit } from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import Joi from "joi"
import { AppConfigService } from "../AppConfigService"
import {
  PublicServerSource,
  ServerSourcesService,
} from "./server-sources.service"

export type ServerSourceConfig = {
  id: string
  name: string
  path: string
  enabled: boolean
}

export type InstanceConfig = {
  version: 1
  serverSources: ServerSourceConfig[]
}

const DEFAULT_INSTANCE_CONFIG: InstanceConfig = {
  version: 1,
  serverSources: [],
}

const serverSourceConfigSchema = Joi.object<ServerSourceConfig>({
  id: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  path: Joi.string().trim().min(1).required(),
  enabled: Joi.boolean().required(),
})

const instanceConfigSchema = Joi.object<InstanceConfig>({
  version: Joi.number().valid(1).required(),
  serverSources: Joi.array().items(serverSourceConfigSchema).required(),
})

const parseInstanceConfig = (value: unknown): InstanceConfig => {
  const validation = instanceConfigSchema.validate(value, {
    abortEarly: false,
  })

  if (validation.error) {
    throw new Error(validation.error.message)
  }

  return validation.value
}

@Injectable()
export class InstanceConfigService implements OnModuleInit {
  private initializationPromise: Promise<void> | null = null

  constructor(
    @Inject(AppConfigService)
    private readonly appConfig: Pick<
      AppConfigService,
      "CONFIG_DIR" | "CONFIG_FILE"
    >,
    private readonly serverSourcesService: ServerSourcesService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialized()
  }

  async getConfig(): Promise<InstanceConfig> {
    await this.ensureInitialized()

    return this.readConfigFile()
  }

  async updateConfig(
    updater: (
      config: InstanceConfig,
    ) => InstanceConfig | Promise<InstanceConfig>,
  ): Promise<InstanceConfig> {
    const currentConfig = await this.getConfig()
    const nextConfig = parseInstanceConfig(await updater(currentConfig))

    await this.writeConfigFile(nextConfig)

    return nextConfig
  }

  async getServerSources(): Promise<ServerSourceConfig[]> {
    const config = await this.getConfig()

    return this.serverSourcesService.list(config.serverSources)
  }

  async getEnabledServerSources(): Promise<PublicServerSource[]> {
    const config = await this.getConfig()

    return this.serverSourcesService.listEnabled(config.serverSources)
  }

  async createServerSource(input: {
    name: string
    path: string
    enabled?: boolean
  }): Promise<ServerSourceConfig> {
    let createdSource: ServerSourceConfig | null = null

    await this.updateConfig(async (config) => {
      const result = await this.serverSourcesService.create({
        sources: config.serverSources,
        input,
      })

      createdSource = result.source

      return {
        ...config,
        serverSources: result.sources,
      }
    })

    if (!createdSource) {
      throw new Error("Server source was not created")
    }

    return createdSource
  }

  async updateServerSource(
    id: string,
    input: {
      name?: string
      path?: string
      enabled?: boolean
    },
  ): Promise<ServerSourceConfig> {
    let updatedSource: ServerSourceConfig | null = null

    await this.updateConfig(async (config) => {
      const result = await this.serverSourcesService.update({
        id,
        input,
        sources: config.serverSources,
      })

      updatedSource = result.source

      return {
        ...config,
        serverSources: result.sources,
      }
    })

    if (!updatedSource) {
      throw new Error("Server source was not updated")
    }

    return updatedSource
  }

  async deleteServerSource(id: string): Promise<void> {
    await this.updateConfig((config) => ({
      ...config,
      serverSources: this.serverSourcesService.remove(id, config.serverSources),
    }))
  }

  private async ensureInitialized() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize()
    }

    return this.initializationPromise
  }

  private async initialize() {
    await fs.promises.mkdir(this.appConfig.CONFIG_DIR, { recursive: true })

    try {
      await fs.promises.access(this.appConfig.CONFIG_FILE, fs.constants.F_OK)
    } catch {
      await this.writeConfigFile(DEFAULT_INSTANCE_CONFIG)
      return
    }

    await this.readConfigFile()
  }

  private async readConfigFile(): Promise<InstanceConfig> {
    let rawContent: string

    try {
      rawContent = await fs.promises.readFile(
        this.appConfig.CONFIG_FILE,
        "utf8",
      )
    } catch (error) {
      throw new Error(
        `Failed to read instance config file at ${this.appConfig.CONFIG_FILE}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }

    let parsedContent: unknown

    try {
      parsedContent = JSON.parse(rawContent)
    } catch (error) {
      throw new Error(
        `Invalid JSON in instance config file at ${this.appConfig.CONFIG_FILE}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }

    try {
      return parseInstanceConfig(parsedContent)
    } catch (error) {
      throw new Error(
        `Invalid instance config file at ${this.appConfig.CONFIG_FILE}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }
  }

  private async writeConfigFile(config: InstanceConfig) {
    const directory = path.dirname(this.appConfig.CONFIG_FILE)
    const temporaryFile = path.join(
      directory,
      `${path.basename(this.appConfig.CONFIG_FILE)}.tmp`,
    )
    const serialized = JSON.stringify(config, null, 2)

    await fs.promises.writeFile(temporaryFile, `${serialized}\n`, "utf8")
    await fs.promises.rename(temporaryFile, this.appConfig.CONFIG_FILE)
  }
}
