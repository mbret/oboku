import { BehaviorSubject, filter, first } from "rxjs"
import { Logger } from "../debug/logger.shared"

type ServerConfig = {
  API_COUCH_URI?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_API_KEY?: string
  DROPBOX_CLIENT_ID?: string
}

const restoreConfig = () => {
  const config = localStorage.getItem("config")

  return config ? (JSON.parse(config) as ServerConfig) : undefined
}

/**
 * We use the localstorage config first.
 * Then we fetch a fresh config on every app restart.
 */
class Configuration extends BehaviorSubject<{
  state: "loading" | "loaded"
  config: ServerConfig
}> {
  constructor() {
    const restoredConfig = restoreConfig()

    Logger.log("Restored config", restoredConfig)

    super({
      state: restoredConfig ? "loaded" : "loading",
      config: restoredConfig ?? {},
    })

    this.loadConfig()
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

  fetchConfig = async (): Promise<ServerConfig | undefined> => {
    const res = await fetch(`${this.API_URL}/web/config`)
    const data = await res.json()

    if (res.status === 200) {
      return data
    }

    Logger.error("Failed to fetch config", res)
  }

  get API_URL() {
    return import.meta.env.VITE_API_URL || `https://api.oboku.me`
  }

  get API_COUCH_URI() {
    return this.value.config.API_COUCH_URI
  }

  get VITE_FIREBASE_CONFIG() {
    return import.meta.env.VITE_FIREBASE_CONFIG
  }

  get READER_NOTIFICATION_TIME_TO_SCREEN() {
    return 2000
  }

  get READER_NOTIFICATION_THROTTLE_TIME() {
    return 300
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
}

export const configuration = new Configuration()
