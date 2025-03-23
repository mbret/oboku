export interface EnvironmentVariables {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  TMP_DIR: string
  TMP_DIR_BOOKS: string
  METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS: string[]
  COVER_ALLOWED_EXT: string[]
  COVER_MAXIMUM_SIZE_FOR_STORAGE: { width: number; height: number }
  NODE_ENV: "development" | "production"
  PORT: number
  COUCH_DB_URL: string
  CONTACT_TO_ADDRESS: string
  GOOGLE_BOOK_API_URL: string
  COVERS_BUCKET_NAME: string
  COVERS_PLACEHOLDER_BUCKET_KEY: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  GOOGLE_CLIENT_ID?: string
}
