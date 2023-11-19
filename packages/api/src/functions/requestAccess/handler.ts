import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { createHttpError } from "@libs/httpErrors"
import { withMiddy } from "@libs/lambda"
import schema from "./schema"
import nodemailer from "nodemailer"
import { CONTACT_TO_ADDRESS } from "../../constants"
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"

const ssm = new SSMClient({ region: "us-east-1" })

const getGmailAppPassword = () => {
  return ssm
    .send(
      new GetParameterCommand({
        Name: `gmail-app-password`,
        WithDecryption: true
      })
    )
    .then((value) => value.Parameter?.Value)
}

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  if (!event.body.email) {
    throw createHttpError(400)
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: CONTACT_TO_ADDRESS,
      pass: (await getGmailAppPassword()) ?? ``
    }
  })

  await transporter.sendMail({
    from: event.body.email,
    to: CONTACT_TO_ADDRESS,
    subject: "Request access for oboku",
    text: event.body.email
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `success` })
  }
}

export const main = withMiddy(lambda)
