class ServiceWorkerConfiguration {
  get API_URL() {
    return (
      import.meta.env.VITE_API_URL ||
      `${self.location.protocol}//${self.location.hostname}:3000`
    )
  }

  get SW_COVERS_CACHE_KEY() {
    return `covers`
  }
}

export const serviceWorkerConfiguration = new ServiceWorkerConfiguration()
