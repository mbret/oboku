import { BehaviorSubject } from "rxjs"
import type { SharedConfig } from "./types.shared"

/**
 * We use the localstorage config first.
 * Then we fetch a fresh config on every app restart.
 */
class ServiceWorkerConfiguration extends BehaviorSubject<{
  config: SharedConfig
}> {
  constructor() {
    super({
      config: {},
    })
  }

  public update(config: SharedConfig) {
    this.next({ config })
  }

  get API_URL() {
    return this.value.config.API_URL
  }

  get SW_COVERS_CACHE_KEY() {
    return `covers`
  }
}

export const serviceWorkerConfiguration = new ServiceWorkerConfiguration()
