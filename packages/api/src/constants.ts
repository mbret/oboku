// DO NOT STORE ANY SECRETS HERE
export const COUCH_DB_URL = process.env.COUCH_DB_URL ?? `__COUCH_DB_URL__`
export const CONTACT_TO_ADDRESS =
  process.env.CONTACT_TO_ADDRESS ?? `__CONTACT_TO_ADDRESS__`
export const STAGE = process.env.STAGE ?? `dev`
export const AWS_API_URI = process.env.AWS_API_URI ?? `__AWS_API_URI__`
export const GOOGLE_BOOK_API_URL =
  process.env.GOOGLE_BOOK_API_URL ?? `__GOOGLE_BOOK_API_URL__`
export const OFFLINE = process.env.OFFLINE === `true` ? true : false

// env unrelated to environment
export const TMP_DIR = "/tmp"
export const METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = [
  "application/x-cbz",
  "application/epub+zip",
  "application/zip",
  "application/x-rar"
]
export const COVER_ALLOWED_EXT = [".jpg", ".jpeg", ".png"]
export const COVER_MAXIMUM_SIZE_FOR_STORAGE = { width: 400, height: 600 }
