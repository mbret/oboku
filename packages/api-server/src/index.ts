import dotevn from 'dotenv'
dotevn.config({ path: `${__dirname}/../.env` })

import * as fs from 'fs'
import { IS_USING_SSL, SSL_CERT_PATH, SSL_PRIVATE_KEY_PATH, IS_DEV } from './constants';
import { ErrorRequestHandler } from "express";
import express from 'express'
import cors from 'cors'
import { router } from './routes'
import { awsProxyRouter } from './routes/awsProxyRouter'
import https from 'https'
import { urlencoded, json } from 'body-parser';
import * as spdy from 'spdy'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@oboku/api-shared'

  ; (async () => {
    const app = express();

    app.use(cors({
      credentials: true,
      origin: [
        'http://localhost:3000',
        'http://10.0.2.2:3000', // allow mobile loopback
        'https://app.oboku.me',
        'https://oboku.me'
      ],
    }))

    app.use(awsProxyRouter)

    app.use((req, res, next) => {
      if (IS_DEV) {
        console.log(req.url)
      }
      res.header('Access-Control-Expose-Headers', 'oboku-content-length');
      // res.header('Access-Control-Allow-Method', 'oboku-content-length');
      next()
    })
    app.use(json())
    app.use(urlencoded({ extended: false }))
    app.use(router)

    const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({ errors: error.errors })
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ errors: error.errors })
      }

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({ errors: [] })
      }

      console.error(error)

      return res.status(500).json({ error: !IS_DEV ? null : error.toString() });
    }

    app.use(errorHandler)

    let server: https.Server
    if (IS_USING_SSL) {
      server = spdy.createServer({
        key: fs.readFileSync(SSL_PRIVATE_KEY_PATH, 'utf8'),
        cert: fs.readFileSync(SSL_CERT_PATH, 'utf8'),
      }, app)
    } else {
      server = spdy.createServer({}, app)
    }

    const listener = server.listen(process.env.PORT || (IS_USING_SSL ? 443 : 4000), () => {
      console.log(`🚀  Server ready at http://localhost:${(listener.address() as any)?.port}`);
    });
  })()