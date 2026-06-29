import { getApiUrl } from "./configuration.shared"

class ServiceWorkerConfiguration {
  get API_URL() {
    return getApiUrl()
  }

  get SW_COVERS_CACHE_KEY() {
    return `covers`
  }
}

export const serviceWorkerConfiguration = new ServiceWorkerConfiguration()
