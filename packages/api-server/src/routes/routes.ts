import * as express from 'express'
import { COUCH_DB_PROXY_SECRET, COUCH_DB_URL, GMAIL_APP_PASSWORD, JWT_PRIVATE_KEY_PATH } from "../constants";
import request from 'request'
import { createAuthenticator } from '@oboku/api-shared/dist/auth'
import * as nodemailer from 'nodemailer'
import crypto from 'crypto'
import * as fs from 'fs'

const privateKey = fs.readFileSync(JWT_PRIVATE_KEY_PATH, { encoding: 'utf-8' })

const authenticator = createAuthenticator({
  privateKey
})

const router = express.Router();

router.get('/', (_, res) => {
  return res.status(200).send('ok')
})

router.post('/request-access', async (req, res, next) => {
  try {
    if (!req.body.email) throw new Error(`invalid email (${req.body.email})`)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bret.maxime@gmail.com',
        pass: GMAIL_APP_PASSWORD
      }
    });
    await transporter.sendMail({
      from: req.body.email,
      to: 'bret.maxime@gmail.com',
      subject: 'Request access for oboku',
      text: req.body.email
    })

    return res.sendStatus(200)
  } catch (e) {
    return next(e)
  }
})

const syncRoute = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.url === '/sync/') {
      return res.status(200).json({})
    }

    const tokenData = (await authenticator.withToken(req.headers.authorization))

    if (!(tokenData?.email)) {
      // We need to use same format as couchdb so that rxdb actually recognize it and 
      // trigger observers
      return res.status(401).json({ error: "unauthorized" })
    }

    const hexEncodedUserId = Buffer.from(tokenData?.email).toString('hex')

    // @todo clean any headers
    // @see https://gist.github.com/cmawhorter/a527a2350d5982559bb6

    const urlPartToProxy = req.url.replace('/sync', '')
    const dbUrl = `${COUCH_DB_URL}/userdb-${hexEncodedUserId}${urlPartToProxy}`
    return request({
      uri: dbUrl,
      method: req.method.toUpperCase(),
      body: req.body,
      rejectUnauthorized: false,
      json: true,
      headers: {
        ...req.headers,
        // 'X-Auth-CouchDB-Roles': '_admin', // DO NOT USE ADMIN
        'X-Auth-CouchDB-Token': crypto.createHmac('sha1', COUCH_DB_PROXY_SECRET).update(tokenData.email).digest('hex'),
        'X-Auth-CouchDB-UserName': tokenData.email,
      }
    }, (error, response, body) => {
      if (error) return next(error)

      res.status(response.statusCode)
      res.set(response.headers)
      res.send(body)
    })

  } catch (e) {
    next(e)
  }
}

router.get('/sync/*', syncRoute)
router.put('/sync/*', syncRoute)
router.post('/sync/*', syncRoute)
router.delete('/sync/*', syncRoute)
router.get('/sync/*', syncRoute)

router.options('*', (_, res) => {
  return res.sendStatus(200)
})

router.all('*', (_, res) => {
  return res.status(404).send('What?')
})

export { router }

