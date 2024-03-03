/// <reference types="vite/client" />

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
  /**
   * supabase is used for communication and other general
   * (non users) purposes
   */
  readonly VITE_SUPABASE_API_KEY?: string
  readonly VITE_SUPABASE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
