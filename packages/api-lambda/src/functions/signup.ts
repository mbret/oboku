import { lambda } from '../utils'
import { generateToken } from "../auth"
import { Errors, validators } from '@oboku/shared'
import { BadRequestError } from '@oboku/api-shared/src/errors'
import { auth, createUser } from '@oboku/api-shared/src/db/helpers'
import { getNano } from '../db/helpers'
import { PromiseReturnType } from '../types'
import { getEventBody } from '../utils/getEventBody'

type Params = { email?: string, password?: string, code?: string }

export const fn = lambda(async (event) => {
  const bodyAsJson = getEventBody(event)

  if (!await validators.signinSchema.isValid(bodyAsJson)) {
    throw new BadRequestError()
  }

  const { email = '', password = '', code = '' } = bodyAsJson
  const superAdminSensitiveNanoInstance = getNano({ asAdmin: true })
  const db = superAdminSensitiveNanoInstance.use('beta')

  const res = (await db.get(code)) as PromiseReturnType<typeof db.get> & { email?: string }

  if (res.email !== email)
    throw new BadRequestError([{ code: Errors.ERROR_INVALID_BETA_CODE }])

  try {
    await createUser(superAdminSensitiveNanoInstance, email, password)
  } catch (e) {
    if (e?.statusCode === 409) {
      throw new BadRequestError([{ code: Errors.ERROR_EMAIL_TAKEN }])
    }
    throw e
  }

  const authResponse = await auth(superAdminSensitiveNanoInstance, email, password)

  if (!authResponse) throw new BadRequestError()

  const userId = Buffer.from(email).toString('hex')
  const token = await generateToken(email, userId)

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      userId,
    })
  }
})

