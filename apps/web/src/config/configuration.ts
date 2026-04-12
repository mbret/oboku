import { BehaviorSubject, filter, first } from "rxjs"
import { Logger } from "../debug/logger.shared"
import { httpClientApi } from "../http/httpClientApi.web"
import type { GetWebConfigResponse } from "@oboku/shared"

const restoreConfig = () => {
  const config = localStorage.getItem("config")

  return config
    ? (JSON.parse(config) as Partial<GetWebConfigResponse>)
    : undefined
}

/**
 * We use the localstorage config first.
 * Then we fetch a fresh config on every app restart.
 */
class Configuration extends BehaviorSubject<{
  state: "loading" | "loaded"
  config: Partial<GetWebConfigResponse>
}> {
  private hasStartedLoading = false

  constructor() {
    const restoredConfig = restoreConfig()

    Logger.log("Restored config", restoredConfig)

    super({
      state: restoredConfig ? "loaded" : "loading",
      config: restoredConfig ?? {},
    })
  }

  loaded$ = this.pipe(
    filter(({ state }) => state === "loaded"),
    first(),
  )

  loadConfig = async () => {
    const fetchedConfig = await this.fetchConfig()

    if (fetchedConfig) {
      Logger.log("Fetched config", fetchedConfig)

      this.next({
        state: "loaded",
        config: fetchedConfig,
      })

      localStorage.setItem("config", JSON.stringify(fetchedConfig))
    }
  }

  ensureConfigLoaded = () => {
    if (this.hasStartedLoading) return

    this.hasStartedLoading = true

    void this.loadConfig()
  }

  fetchConfig = async (): Promise<GetWebConfigResponse | undefined> => {
    try {
      const { data } = await httpClientApi.fetchOrThrow<GetWebConfigResponse>(
        `${this.API_URL}/web/config`,
      )

      return data
    } catch (error) {
      Logger.error("Failed to fetch config", error)
    }
  }

  get API_URL() {
    return (
      import.meta.env.VITE_API_URL ||
      `${window.location.protocol}//${window.location.hostname}:3000`
    )
  }

  get API_WEBDAV_URL() {
    return `${this.API_URL}/webdav`
  }

  get API_COUCH_URI() {
    return (
      import.meta.env.VITE_COUCH_DB_PUBLIC_URL ??
      `${window.location.protocol}//${window.location.hostname}:5984`
    )
  }

  get API_COUCH_URI_2() {
    return (
      import.meta.env.VITE_COUCH_DB_PUBLIC_URL_2 ??
      `${window.location.protocol}//${window.location.hostname}:5985`
    )
  }

  get API_COUCH_URI_3() {
    return (
      import.meta.env.VITE_COUCH_DB_PUBLIC_URL_3 ??
      `${window.location.protocol}//${window.location.hostname}:5986`
    )
  }

  get API_COUCH_URI_4() {
    return (
      import.meta.env.VITE_COUCH_DB_PUBLIC_URL_4 ??
      `${window.location.protocol}//${window.location.hostname}:5987`
    )
  }

  get VITE_FIREBASE_CONFIG() {
    return import.meta.env.VITE_FIREBASE_CONFIG
  }

  get SEARCH_MAX_PREVIEW_ITEMS() {
    return 8
  }

  get STORAGE_PROFILE_KEY() {
    return `profile`
  }

  get COLLECTION_EMPTY_ID() {
    return `oboku_dangling_books`
  }

  get CLEANUP_DANGLING_LINKS_INTERVAL() {
    return 1000 * 60 * 10 // 10mn
  }

  get MINIMUM_TOKEN_VALIDITY_MS() {
    return 1000 * 60 * 5 // 5mn
  }

  /**
   * Used for:
   * - signin with google
   * - drive picker
   */
  get GOOGLE_CLIENT_ID() {
    return this.value.config.GOOGLE_CLIENT_ID
  }

  /**
   * Used for:
   * - drive picker
   */
  get GOOGLE_APP_ID() {
    const clientId = this.GOOGLE_CLIENT_ID

    return clientId ? clientId.split("-")[0] : undefined
  }

  /**
   * Used for:
   * - drive picker
   */
  get GOOGLE_API_KEY() {
    return this.value.config.GOOGLE_API_KEY
  }

  get DROPBOX_CLIENT_ID() {
    return this.value.config.DROPBOX_CLIENT_ID
  }

  get MICROSOFT_APPLICATION_CLIENT_ID() {
    return this.value.config.MICROSOFT_APPLICATION_CLIENT_ID
  }

  get MICROSOFT_APPLICATION_AUTHORITY() {
    return this.value.config.MICROSOFT_APPLICATION_AUTHORITY
  }

  get FEATURE_GOOGLE_SIGN_ENABLED() {
    return !!this.GOOGLE_CLIENT_ID
  }

  get FEATURE_GOOGLE_DRIVE_ENABLED() {
    return (
      !!this.GOOGLE_API_KEY && !!this.GOOGLE_APP_ID && !!this.GOOGLE_CLIENT_ID
    )
  }

  get FEATURE_DROPBOX_ENABLED() {
    return !!this.DROPBOX_CLIENT_ID
  }

  get FEATURE_ONE_DRIVE_ENABLED() {
    return !!this.MICROSOFT_APPLICATION_CLIENT_ID
  }

  get FEATURE_SERVER_SYNC_ENABLED() {
    return !!this.value.config.FEATURE_SERVER_SYNC_ENABLED
  }

  get SHOW_DISABLED_PLUGINS() {
    return !!this.value.config.SHOW_DISABLED_PLUGINS
  }
}

export const configuration = new Configuration()
