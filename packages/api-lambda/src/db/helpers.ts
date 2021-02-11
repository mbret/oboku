import { COUCH_DB_URL, COUCH_DB_PROXY_SECRET } from "../constants";
import createNano from 'nano'
import crypto from 'crypto'

export const getNanoDbForUser = (userEmail: string) => {
  const couchDbSecret = crypto.createHmac('sha1', COUCH_DB_PROXY_SECRET)
  const hexEncodedUserId = Buffer.from(userEmail).toString('hex')

  const db = createNano({
    url: COUCH_DB_URL,
    // log: (...args) => console.log('nano', JSON.stringify(...args)),
    requestDefaults: {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        'X-Auth-CouchDB-Token': couchDbSecret.update(userEmail).digest('hex'),
        'X-Auth-CouchDB-UserName': userEmail,
      }
    } as any
  })
  return db.use(`userdb-${hexEncodedUserId}`)
}

/**
 * 
 * WARNING: be very careful when using nano as admin since you will have full power.
 * As you know with gret power comes great responsabilities
 */
export const getNano = ({ asAdmin }: { asAdmin: boolean } = { asAdmin: false }) => {
  const couchDbSecret = crypto.createHmac('sha1', COUCH_DB_PROXY_SECRET)
  const db = createNano({
    url: COUCH_DB_URL,
    // log: (...args) => console.log('nano', JSON.stringify(...args)),
    requestDefaults: {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        ...asAdmin && {
          'X-Auth-CouchDB-Roles': '_admin',
          'X-Auth-CouchDB-Token': couchDbSecret.update('admin').digest('hex'),
          'X-Auth-CouchDB-UserName': 'admin',
        },
      }
    } as any
  })

  return db
}