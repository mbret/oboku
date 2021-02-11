import * as path from 'path'

// the whole package is bundled and the folder structure is flattened to root dir
export const ROOT_DIR = `${__dirname}`
export const ASSETS_PATH = path.join(ROOT_DIR, 'assets')
export const TMP_DIR = '/tmp'

export const JWT_PRIVATE_KEY_PATH = path.join(ROOT_DIR, '.secrets', 'jwt-private-key.key')
export const GOOGLE_CLIENT_SECRET_PATH = path.join(ROOT_DIR, process.env.GOOGLE_CLIENT_SECRET_PATH || '')

export const IS_PRODUCTION = process.env.ENV !== 'DEV'

export const KNOWN_CONTENT_TYPES = [
  'application/epub+zip',
]

export const COVER_MAXIMUM_SIZE_FOR_STORAGE = { width: 400, height: 600 }

export const WASABI_AWS_ACCESS_KEY = process.env.WASABI_AWS_ACCESS_KEY || ''
export const WASABI_AWS_SECRET_KEY = process.env.WASABI_AWS_SECRET_KEY || ''

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
export const COUCH_DB_PROXY_SECRET = process.env.COUCH_DB_PROXY_SECRET || 'CouchDbProxySecret'
export const COUCH_DB_URL = process.env.COUCH_DB_URL || 'https://api.oboku.me:5985'

export const AWS_API_URI = IS_PRODUCTION ? 'https://tbgjkqn0m5.execute-api.us-east-1.amazonaws.com/Prod' : 'http://host.docker.internal:4001'