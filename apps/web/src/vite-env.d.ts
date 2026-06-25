/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /**
   * Additional API origins, used only to spread replication across origins and
   * work around the browser's per-origin HTTP/1 connection limit. They default
   * to VITE_API_URL and can stay unset when serving the API over HTTP/2.
   */
  readonly VITE_API_URL_2?: string
  readonly VITE_API_URL_3?: string
  readonly VITE_API_URL_4?: string
  /**
   * firebase is used for tracking and analysis
   */
  readonly VITE_FIREBASE_CONFIG?: string
  readonly SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
