import { COUCH_DB_URL, COUCH_DB_PROXY_SECRET } from "../constants";
import createNano from 'nano'
import crypto from 'crypto'
import { generateAdminToken, generateToken } from "../auth";

export const getNanoDbForUser = async (userEmail: string) => {
  // const couchDbSecret = crypto.createHmac('sha1', COUCH_DB_PROXY_SECRET)
  const hexEncodedUserId = Buffer.from(userEmail).toString('hex')

  const db = await getNano({ jwtToken: await generateToken(userEmail, hexEncodedUserId) })

  return db.use(`userdb-${hexEncodedUserId}`)
}

export const getNano = async ({ jwtToken }: { jwtToken?: string } = {}) => {
  return createNano({
    url: COUCH_DB_URL,
    // log: (...args) => console.log('nano', JSON.stringify(...args)),
    requestDefaults: {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        ...jwtToken && {
          Authorization: `Bearer ${jwtToken}`
        }
      }
    } as any
  })
}

/**
 * 
 * WARNING: be very careful when using nano as admin since you will have full power.
 * As you know with gret power comes great responsabilities
 */
export const getAdminNano = async () => {
  return getNano({ jwtToken: await generateAdminToken() })
}

export const auth = async (username: string, userpass: string) => {
  const db = await getNano()

  try {
    const response = await db.auth(username, userpass)
    if (!response.ok || !response.name) {
      return null
    }
    return response
  } catch (e) {
    if (e.statusCode === 401) return null
    throw e
  }
}