import * as path from 'path'

export const IS_DEV = process.env.NODE_ENV === 'development'

export const ROOT_DIR = `${__dirname}/..`

export const IS_USING_SSL = process.env.SSL === 'true'
export const SSL_PRIVATE_KEY_PATH = process.env.SSL_PRIVATE_KEY_PATH || ''
export const SSL_CERT_PATH = process.env.SSL_CERT_PATH || ''

export const JWT_PRIVATE_KEY_PATH = path.join(ROOT_DIR, process.env.JWT_PRIVATE_KEY_PATH || '') 
export const JWT_PEM_PATH = path.join(ROOT_DIR, process.env.JWT_PEM_PATH || '')

export const COUCH_DB_URL = process.env.COUCH_DB_URL || 'http://127.0.0.1:5984'
export const COUCH_DB_URL_ADMIN_URL = process.env.COUCH_DB_URL_ADMIN_URL || 'http://admin:password@127.0.0.1:5984'
export const COUCH_DB_PROXY_SECRET = process.env.COUCH_DB_PROXY_SECRET || 'unknown'

export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

export const AWS_API_URI = process.env.AWS_API_URI || 'http://0.0.0.0:4001'