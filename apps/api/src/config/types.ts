export interface EnvironmentVariables {
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  NODE_ENV: "development" | "production"
  PORT: number
  COUCH_DB_URL: string
  GOOGLE_BOOK_API_URL: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_API_KEY?: string
  DROPBOX_CLIENT_ID?: string
  TMP_X_ACCESS_SECRET?: string
  COMICVINE_API_KEY?: string
  JWT_PRIVATE_KEY_FILE: string
  JWT_PRIVATE_KEY?: string
  JWT_PUBLIC_KEY_FILE?: string
  JWT_PUBLIC_KEY?: string
  API_DATA_DIR: string
  COVERS_BUCKET_NAME?: string
  COVERS_STORAGE_STRATEGY: "s3" | "fs"
  ADMIN_LOGIN?: string
  ADMIN_PASSWORD?: string
}
