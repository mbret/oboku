import { lambda } from '../utils'
import { generateToken } from "../auth"
import { Errors, validators } from '@oboku/shared/src'
import { BadRequestError } from '../errors'
import { createUser } from '../db/helpers'
import { auth, getAdminNano } from '../db/helpers'
import { PromiseReturnType } from '../types'
import { getEventBody } from '../utils/getEventBody'

type Params = { email?: string, password?: string, code?: string }

export const fn = lambda(async (event) => {
  const bodyAsJson: Params = getEventBody(event)

  if (!await validators.signupSchema.isValid(bodyAsJson)) {
    throw new BadRequestError()
  }

  const { email = '', password = '', code = '' } = bodyAsJson
  const superAdminSensitiveNanoInstance = await getAdminNano()
  const db = superAdminSensitiveNanoInstance.use('beta')

  let foundEmail = undefined
  try {
    const res = (await db.get(code)) as PromiseReturnType<typeof db.get> & { email?: string }
    foundEmail = res.email
  } catch (e) {
    if (e.statusCode !== 404) {
      throw e
    }
  }

  if (foundEmail !== email)
    throw new BadRequestError([{ code: Errors.ERROR_INVALID_BETA_CODE }])

  try {
    await createUser(superAdminSensitiveNanoInstance, email, password)
  } catch (e) {
    if (e?.statusCode === 409) {
      throw new BadRequestError([{ code: Errors.ERROR_EMAIL_TAKEN }])
    }
    throw e
  }

  const authResponse = await auth(email, password)

  if (!authResponse) throw new BadRequestError()

  const userId = Buffer.from(email).toString('hex')
  const token = await generateToken(email, userId)

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      userId,
      dbName: `userdb-${userId}`
    })
  }
})

