import jwt from "jsonwebtoken"
import { APIGatewayProxyEvent } from "aws-lambda"
import { createHttpError } from "./httpErrors"
import { getParameterValue } from "./ssm"

const isAuthorized = async ({
  privateKey,
  authorization
}: {
  authorization?: string
  privateKey: string
}) => {
  try {
    if (!authorization) throw new Error("Looks like authorization is empty")

    const token = authorization.replace("Bearer ", "")

    if (!privateKey) {
      console.error(`Unable to retrieve private key`)
      throw createHttpError(401)
    }

    return jwt.verify(token, privateKey, { algorithms: ["RS256"] }) as Token
  } catch (e) {
    throw createHttpError(401)
  }
}

export type Token = {
  name: string
  sub: string
  "_couchdb.roles"?: string[]
}

export const generateToken = async (name: string) => {
  const tokenData: Token = {
    name,
    sub: name,
    "_couchdb.roles": [name]
  }

  return jwt.sign(
    tokenData,
    (await getParameterValue({
      Name: `jwt-private-key`,
      WithDecryption: true
    })) ?? ``,
    { algorithm: "RS256" }
  )
}

// https://docs.couchdb.org/en/3.2.0/config/couch-peruser.html#couch_peruser
export const generateAdminToken = async (options: { sub?: string } = {}) => {
  const data: Token = {
    name: "admin",
    sub: "admin",
    "_couchdb.roles": ["_admin"],
    ...options
  }

  return jwt.sign(
    data,
    (await getParameterValue({
      Name: `jwt-private-key`,
      WithDecryption: true
    })) ?? ``,
    { algorithm: "RS256" }
  )
}

export const withToken = async (
  event: Pick<APIGatewayProxyEvent, `headers`>,
  privateKey: string
) => {
  const authorization =
    (event.headers.Authorization as string | undefined) ||
    (event.headers.authorization as string | undefined)

  return await isAuthorized({ authorization, privateKey })
}
