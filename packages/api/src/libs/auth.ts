import jwt from "jsonwebtoken"
import { APIGatewayProxyEvent } from "aws-lambda"
import { createHttpError } from "./httpErrors"
import { from } from "rxjs"

const isAuthorized = async ({
  privateKey,
  authorization,
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

export const generateToken = async (name: string, privateKey: string) => {
  const tokenData: Token = {
    name,
    sub: name,
    "_couchdb.roles": [name],
  }

  return jwt.sign(tokenData, privateKey, { algorithm: "RS256" })
}

// https://docs.couchdb.org/en/3.2.0/config/couch-peruser.html#couch_peruser
export const generateAdminToken = async ({
  privateKey,
  ...options
}: {
  sub?: string
  privateKey: string
}) => {
  const data: Token = {
    name: "admin",
    sub: options.sub ?? "admin",
    "_couchdb.roles": ["_admin"],
  }

  return jwt.sign(data, privateKey, { algorithm: "RS256" })
}

export const getAuthTokenAsync = async (
  event: Pick<APIGatewayProxyEvent, `headers`>,
  privateKey: string,
) => {
  const authorization =
    (event.headers.Authorization as string | undefined) ||
    (event.headers.authorization as string | undefined)

  return await isAuthorized({ authorization, privateKey })
}

export const getAuthToken = (authorization: string, privateKey: string) =>
  from(
    getAuthTokenAsync(
      {
        headers: {
          authorization,
        },
      },
      privateKey,
    ),
  )
