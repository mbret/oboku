/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /**
   * couchdb is used for users database
   */
  readonly VITE_API_COUCH_URI?: string
  /**
   * firebase is used for tracking and analysis
   */
  readonly VITE_FIREBASE_CONFIG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
