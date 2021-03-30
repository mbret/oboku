import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import { JWT_PRIVATE_KEY_PATH } from '../constants'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { UnauthorizedError } from '../errors'

const JWT_PRIVATE_KEY = fs.readFileSync(JWT_PRIVATE_KEY_PATH, 'utf8')

const _withToken = (privateKey: string) => async (authorization?: string) => {
  try {
    if (!authorization) throw new Error('Looks like authorization is empty')

    const token = authorization.replace('Bearer ', '')

    return jwt.verify(token, privateKey, { algorithms: ['RS256'] }) as Token
  } catch (e) {
    throw new UnauthorizedError()
  }
}

export const createAuthenticator = ({ privateKey }: { privateKey: string }) => ({
  withToken: _withToken(privateKey)
})

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



// const createRefreshToken = (name: string, authSession: string) => {
//   return generateToken(name, '1d')
// }

// const generateToken = async (email: string, userId: string, expiresIn: string = '1d') => {
//   const tokenData: Token = { email, userId }

//   return jwt.sign(tokenData, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
// }

