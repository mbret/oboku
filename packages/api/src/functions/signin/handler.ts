/**
 * @important
 * If a user has already been created and then deleted, re-creating it later from
 * http calls will not re-create the user db automatically. It can be done through
 * couchdb admin directly or probably by completely pruning db data.
 */
import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import schema from "./schema"
import { getAuth } from "firebase-admin/auth"
import {
  getDangerousAdminNano,
  getOrCreateUserFromEmail,
} from "@libs/couch/dbHelpers"
import { generateToken } from "@libs/auth"
import { ObokuErrorCode } from "@oboku/shared"
import { createHttpError } from "@libs/httpErrors"
import { getParametersValue } from "@libs/ssm"
import { withMiddy } from "@libs/middy/withMiddy"
import { getFirebaseApp } from "@libs/firebase/app"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event,
) => {
  const [jwtPrivateKey = ``, xAccessSecret = ``] = await getParametersValue({
    Names: ["jwt-private-key", "x-access-secret"],
    WithDecryption: true,
  })

  const { token } = event.body
  const firebaseAopp = getFirebaseApp()

  const { email, email_verified } =
    await getAuth(firebaseAopp).verifyIdToken(token)

  if (!email) {
    throw createHttpError(400, {
      code: ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL,
    })
  }

  if (!email_verified) {
    throw createHttpError(400, {
      code: ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED,
    })
  }

  const adminNano = await getDangerousAdminNano({
    privateKey: jwtPrivateKey,
    xAccessSecret,
  })

  const user = await getOrCreateUserFromEmail(adminNano, email)

  if (!user) {
    throw new Error("Unable to retrieve user")
  }

  const nameHex = Buffer.from(user.name).toString("hex")
  const userJwtToken = await generateToken(user.name, jwtPrivateKey)

  return {
    statusCode: 200,
    body: JSON.stringify({
      token: userJwtToken,
      nameHex,
      dbName: `userdb-${nameHex}`,
      email: user.email,
    }),
  }
}

export const main = withMiddy(lambda)
