import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import schema from "./schema"
import { validators } from "@oboku/shared"
import createError from "http-errors"
import { auth } from "@libs/dbHelpers"
import createHttpError from "http-errors"
import { generateToken } from "@libs/auth"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  if (!(await validators.signinSchema.isValid(event.body))) {
    throw createError(400)
  }

  const { email, password } = event.body

  const authResponse = await auth(email, password)

  if (!authResponse) throw createHttpError(400)

  const userId = Buffer.from(authResponse.name).toString("hex")
  const token = await generateToken(authResponse.name, userId)

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      userId,
      dbName: `userdb-${userId}`
    })
  }
}

export const main = withMiddy(lambda)
