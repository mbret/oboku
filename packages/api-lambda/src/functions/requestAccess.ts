import { lambda } from '../utils'
import { BadRequestError } from '@oboku/api-shared/src/errors'
import { getEventBody } from '../utils/getEventBody'
import * as nodemailer from 'nodemailer'
import { GMAIL_APP_PASSWORD } from '../constants'

export const fn = lambda(async (event) => {
  const bodyAsJson = getEventBody(event)

  if (!bodyAsJson.email) {
    throw new BadRequestError()
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bret.maxime@gmail.com',
      pass: GMAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: bodyAsJson.email,
    to: 'bret.maxime@gmail.com',
    subject: 'Request access for oboku',
    text: bodyAsJson.email
  })

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
})

