import { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { createHttpError } from '@libs/httpErrors';
import { middyfy } from '@libs/lambda';
import schema from './schema';
import nodemailer from 'nodemailer'
import { SSM } from 'aws-sdk'
import { CONTACT_TO_ADDRESS } from '../../constants';

const ssm = new SSM({ region: 'us-east-1' })

const getGmailAppPassword = () => ssm.getParameter({
  Name: `gmail-app-password`,
  WithDecryption: true
}).promise().then(value => value.Parameter?.Value)

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  if (!event.body.email) {
    throw createHttpError(400)
  }

  console.log((await getGmailAppPassword()))
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: CONTACT_TO_ADDRESS,
      pass: (await getGmailAppPassword()) ?? ``
    }
  });

  await transporter.sendMail({
    from: event.body.email,
    to: CONTACT_TO_ADDRESS,
    subject: 'Request access for oboku',
    text: event.body.email
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `success` })
  }
};

export const main = middyfy(lambda);
