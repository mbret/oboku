/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /**
   * firebase is used for tracking and analysis
   */
  readonly VITE_FIREBASE_CONFIG?: string
  readonly SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
