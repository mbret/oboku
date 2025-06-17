/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /**
   * firebase is used for tracking and analysis
   */
  readonly VITE_FIREBASE_CONFIG?: string
  readonly VITE_COUCH_DB_PUBLIC_URL?: string
  readonly VITE_COUCH_DB_PUBLIC_URL_2?: string
  readonly VITE_COUCH_DB_PUBLIC_URL_3?: string
  readonly VITE_COUCH_DB_PUBLIC_URL_4?: string
  readonly SENTRY_DSN?: string
}

// biome-ignore lint/correctness/noUnusedVariables: override
interface ImportMeta {
  readonly env: ImportMetaEnv
}
