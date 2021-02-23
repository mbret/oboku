import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import { JWT_PRIVATE_KEY_PATH } from '../constants'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { createAuthenticator } from '@oboku/api-shared/src/auth'

const JWT_PRIVATE_KEY = fs.readFileSync(JWT_PRIVATE_KEY_PATH, 'utf8')

const authenticator = createAuthenticator({ privateKey: JWT_PRIVATE_KEY })

export type Token = {
  userId: string,
  email: string,
  sub: string,
  '_couchdb.roles'?: string[]
}

export const createRefreshToken = (name: string, authSession: string) => {
  return generateToken(name, '1d')
}

export const generateToken = async (email: string, userId: string, expiresIn: string = '1d') => {
  const tokenData: Token = { email, userId, sub: email, '_couchdb.roles': [email] }
  
  return jwt.sign(tokenData, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
}

export const generateAdminToken = async () => {
  const data: Token = {
    email: '',
    userId: '',
    sub: 'admin',
    '_couchdb.roles': ['_admin']
  }

  return jwt.sign(data, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
}

export const withToken = async (event: APIGatewayProxyEvent) => {
  const authorization = event.headers.Authorization as string | undefined || event.headers.authorization as string | undefined

  return authenticator.withToken(authorization)
}