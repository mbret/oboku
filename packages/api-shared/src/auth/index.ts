import * as jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../errors'

export type Token = {
  userId: string,
  email: string,
}

// const createRefreshToken = (name: string, authSession: string) => {
//   return generateToken(name, '1d')
// }

// const generateToken = async (email: string, userId: string, expiresIn: string = '1d') => {
//   const tokenData: Token = { email, userId }

//   return jwt.sign(tokenData, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
// }

const withToken = (privateKey: string) => async (authorization?: string) => {
  try {
    if (!authorization) throw new Error('Looks like authorization is empty')

    const token = authorization.replace('Bearer ', '')

    return jwt.verify(token, privateKey, { algorithms: ['RS256'] }) as Token
  } catch (e) {
    throw new UnauthorizedError()
  }
}

export const createAuthenticator = ({ privateKey }: { privateKey: string }) => ({
  withToken: withToken(privateKey)
})