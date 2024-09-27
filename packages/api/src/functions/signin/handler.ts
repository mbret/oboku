/**
 * @important
 * If a user has already been created and then deleted, re-creating it later from
 * http calls will not re-create the user db automatically. It can be done through
 * couchdb admin directly or probably by completely pruning db data.
 */
import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import schema from "./schema"
import { initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getAdminNano, getOrCreateUserFromEmail } from "@libs/couch/dbHelpers"
import { generateToken } from "@libs/auth"
import { ObokuErrorCode } from "@oboku/shared"
import { createHttpError } from "@libs/httpErrors"
import { getParametersValue } from "@libs/ssm"
import { withMiddy } from "@libs/middy/withMiddy"

const firebaseConfig = JSON.parse(
  Buffer.from(process.env.FIREBASE_CONFIG ?? "", "base64").toString() ?? "{}"
)

/**
 * This is an admin without privileges
 */
const app = initializeApp(firebaseConfig)

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const [jwtPrivateKey = ``] = await getParametersValue({
    Names: ["jwt-private-key"],
    WithDecryption: true
  })

  const { token } = event.body

  const { email, email_verified } = await getAuth(app).verifyIdToken(token)

  if (!email) {
    throw createHttpError(400, {
      code: ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL
    })
  }

  if (!email_verified) {
    throw createHttpError(400, {
      code: ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED
    })
  }

  const adminNano = await getAdminNano({ privateKey: jwtPrivateKey })

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
      email: user.email
    })
  }
}

export const main = withMiddy(lambda)
