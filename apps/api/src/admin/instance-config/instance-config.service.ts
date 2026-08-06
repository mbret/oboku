import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import bcrypt from "bcrypt"
import Joi from "joi"
import { BehaviorSubject, Observable } from "rxjs"
import { AppConfigService } from "src/config/AppConfigService"
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

export type WebDavCredentials = {
  username: string
  password: string
}

export type ServerSyncConfig = {
  enabled: boolean
  credentials: WebDavCredentials | null
  sources: ServerSourceConfig[]
}

export type InstanceConfig = {
  version: 1
  serverSync: ServerSyncConfig
  microsoftApplicationClientId?: string
  microsoftApplicationAuthority?: string
  showDisabledPlugins: boolean
  fileDownloadMaxSizeBytes: number
}

export const DEFAULT_FILE_DOWNLOAD_MAX_SIZE_BYTES = 500 * 1024 * 1024

const CONFIG_FILE_RELOAD_DEBOUNCE_MS = 100

const DEFAULT_INSTANCE_CONFIG: InstanceConfig = {
  version: 1,
  serverSync: { enabled: false, credentials: null, sources: [] },
  showDisabledPlugins: true,
  fileDownloadMaxSizeBytes: DEFAULT_FILE_DOWNLOAD_MAX_SIZE_BYTES,
}

const serverSourceConfigSchema = Joi.object<ServerSourceConfig>({
  id: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  path: Joi.string().trim().min(1).required(),
  enabled: Joi.boolean().required(),
})

const webDavCredentialsSchema = Joi.object<WebDavCredentials>({
  username: Joi.string().trim().min(1).required(),
  password: Joi.string().min(8).required(),
})

const serverSyncConfigSchema = Joi.object<ServerSyncConfig>({
  enabled: Joi.boolean().required(),
  credentials: webDavCredentialsSchema.allow(null).default(null),
  sources: Joi.array().items(serverSourceConfigSchema).required(),
})

const instanceConfigSchema = Joi.object<InstanceConfig>({
  version: Joi.number().valid(1).required(),
  serverSync: serverSyncConfigSchema.default({
    enabled: false,
    credentials: null,
    sources: [],
  }),
  microsoftApplicationClientId: Joi.string().trim().empty("").optional(),
  microsoftApplicationAuthority: Joi.string().trim().uri().allow("").optional(),
  showDisabledPlugins: Joi.boolean().default(true),
  fileDownloadMaxSizeBytes: Joi.number()
    .integer()
    .min(1)
    .default(DEFAULT_FILE_DOWNLOAD_MAX_SIZE_BYTES),
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
export class InstanceConfigService implements OnModuleDestroy {
  private readonly logger = new Logger(InstanceConfigService.name)
  private readonly configSubject: BehaviorSubject<InstanceConfig>
  private readonly configFileWatcher: fs.FSWatcher
  private configFileReloadTimeout: NodeJS.Timeout | undefined

  readonly config$: Observable<InstanceConfig>

  constructor(
    @Inject(AppConfigService)
    private readonly appConfig: Pick<
      AppConfigService,
      "CONFIG_DIR" | "CONFIG_FILE"
    >,
    private readonly serverSourcesService: ServerSourcesService,
  ) {
    this.configSubject = new BehaviorSubject(this.initializeConfigFile())
    this.config$ = this.configSubject.asObservable()
    this.configFileWatcher = this.watchConfigFile()
  }

  onModuleDestroy() {
    clearTimeout(this.configFileReloadTimeout)
    this.configFileWatcher.close()
    this.configSubject.complete()
  }

  private initializeConfigFile(): InstanceConfig {
    fs.mkdirSync(this.appConfig.CONFIG_DIR, { recursive: true })

    if (!fs.existsSync(this.appConfig.CONFIG_FILE)) {
      this.writeConfigFile(DEFAULT_INSTANCE_CONFIG)

      return DEFAULT_INSTANCE_CONFIG
    }

    return this.readConfigFile()
  }

  private watchConfigFile() {
    const configFileName = path.basename(this.appConfig.CONFIG_FILE)

    const scheduleReloadOnConfigFileEvent = (
      _eventType: fs.WatchEventType,
      filename: string | null,
    ) => {
      if (filename && filename !== configFileName) return

      clearTimeout(this.configFileReloadTimeout)
      this.configFileReloadTimeout = setTimeout(
        this.refreshConfigFromFile,
        CONFIG_FILE_RELOAD_DEBOUNCE_MS,
      )
    }

    const logWatcherError = (error: Error) => {
      this.logger.error(`Instance config file watcher error: ${error.message}`)
    }

    const watcher = fs.watch(
      this.appConfig.CONFIG_DIR,
      { persistent: false },
      scheduleReloadOnConfigFileEvent,
    )

    watcher.on("error", logWatcherError)

    return watcher
  }

  /**
   * An invalid out-of-band edit keeps the last valid config (and logs)
   * instead of breaking readers.
   */
  private readonly refreshConfigFromFile = () => {
    try {
      const config = this.readConfigFile()

      const configChanged =
        JSON.stringify(config) !== JSON.stringify(this.configSubject.getValue())

      if (configChanged) {
        this.configSubject.next(config)
      }
    } catch (error) {
      this.logger.error(
        `Ignoring instance config file change: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }
  }

  async getConfig(): Promise<InstanceConfig> {
    return this.configSubject.getValue()
  }

  /** Serializes read-modify-write cycles so a stale read never overwrites a newer write. */
  private updateChain: Promise<unknown> = Promise.resolve()

  async updateConfig(
    updater: (
      config: InstanceConfig,
    ) => InstanceConfig | Promise<InstanceConfig>,
  ): Promise<InstanceConfig> {
    const update = this.updateChain
      .catch(function ignorePreviousUpdateFailure() {})
      .then(() => this.applyConfigUpdate(updater))

    this.updateChain = update

    return update
  }

  private async applyConfigUpdate(
    updater: (
      config: InstanceConfig,
    ) => InstanceConfig | Promise<InstanceConfig>,
  ): Promise<InstanceConfig> {
    const currentConfig = this.readConfigFile()
    const nextConfig = parseInstanceConfig(await updater(currentConfig))

    this.writeConfigFile(nextConfig)
    this.configSubject.next(nextConfig)

    return nextConfig
  }

  async getServerSources(): Promise<ServerSourceConfig[]> {
    const config = await this.getConfig()

    return this.serverSourcesService.list(config.serverSync.sources)
  }

  async setWebDavCredentials(credentials: WebDavCredentials): Promise<void> {
    const hashedPassword = await bcrypt.hash(credentials.password, 10)

    await this.updateConfig((config) => ({
      ...config,
      serverSync: {
        ...config.serverSync,
        credentials: {
          username: credentials.username,
          password: hashedPassword,
        },
      },
    }))
  }

  async getEnabledServerSources(): Promise<PublicServerSource[]> {
    const config = await this.getConfig()

    return this.serverSourcesService.listEnabled(config.serverSync.sources)
  }

  async createServerSource(input: {
    name: string
    path: string
    enabled?: boolean
  }): Promise<ServerSourceConfig> {
    let createdSource: ServerSourceConfig | null = null

    await this.updateConfig(async (config) => {
      const result = await this.serverSourcesService.create({
        sources: config.serverSync.sources,
        input,
      })

      createdSource = result.source

      return {
        ...config,
        serverSync: { ...config.serverSync, sources: result.sources },
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
        sources: config.serverSync.sources,
      })

      updatedSource = result.source

      return {
        ...config,
        serverSync: { ...config.serverSync, sources: result.sources },
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
      serverSync: {
        ...config.serverSync,
        sources: this.serverSourcesService.remove(
          id,
          config.serverSync.sources,
        ),
      },
    }))
  }

  private readConfigFile(): InstanceConfig {
    return this.parseConfigFileContent(
      fs.readFileSync(this.appConfig.CONFIG_FILE, "utf8"),
    )
  }

  private parseConfigFileContent(rawContent: string): InstanceConfig {
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

  private writeConfigFile(config: InstanceConfig) {
    const directory = path.dirname(this.appConfig.CONFIG_FILE)
    const temporaryFile = path.join(
      directory,
      `${path.basename(this.appConfig.CONFIG_FILE)}.tmp`,
    )
    const serialized = JSON.stringify(config, null, 2)

    fs.writeFileSync(temporaryFile, `${serialized}\n`, "utf8")
    fs.renameSync(temporaryFile, this.appConfig.CONFIG_FILE)
  }
}
