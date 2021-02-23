import { lambda } from '../utils'
import { generateToken } from "../auth"
import * as validators from '@oboku/shared/src/validators'
import { BadRequestError } from '@oboku/api-shared/src/errors'
import { auth } from '../db/helpers'
import { getEventBody } from '../utils/getEventBody'

export const fn = lambda(async (event) => {
  const bodyAsJson = getEventBody(event)

  if (!await validators.signinSchema.isValid(bodyAsJson)) {
    throw new BadRequestError()
  }

  const { email, password } = bodyAsJson

  const authResponse = await auth(email, password)

  if (!authResponse) throw new BadRequestError()

  const userId = Buffer.from(authResponse.name).toString('hex')
  const token = await generateToken(authResponse.name, userId)

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      userId,
      dbName: `userdb-${userId}`
    })
  }
})

