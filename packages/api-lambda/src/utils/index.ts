import '../loadEnv'
import { READER_SUPPORTED_MIME_TYPES } from "@oboku/shared/src/constants"
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { APIGatewayProxyEvent } from "aws-lambda"
import aws from "aws-sdk"
export { lambda } from '../lambda'

export const detectMimeTypeFromContent = async (filepath: string) => {
  let mimeType: typeof READER_SUPPORTED_MIME_TYPES[number] | undefined = undefined
  try {
    await fs.createReadStream(filepath)
      .pipe(unzipper.Parse())
      .on('entry', function (entry) {
        if (!mimeType && entry.path.endsWith('.opf')) {
          mimeType = 'application/epub+zip'
        }

        entry.autodrain();
      }).promise()
  } catch (e) {
    console.log(`Error when trying to detectMimeTypeFromContent with ${filepath}`)
  }

  return mimeType
}

export const getNormalizedHeader = (event: APIGatewayProxyEvent, header: string): string | null | undefined => {
  let realKey = Object.keys(event.headers).find(key => key.toLowerCase() === header.toLowerCase()) || header

  return event.headers[realKey]
}

export const getAwsLambda = () => new aws.Lambda({
  region: 'us-east-1',
  // endpoint: 'http://0.0.0.0:4001',
  // endpoint: 'http://host.docker.internal:4001',
  // endpoint: new aws.Endpoint('http://host.docker.internal:4002'),
  // endpoint: new aws.Endpoint('localhost:4001'),
  // hostPrefixEnabled: false,
  // sslEnabled: false,
  httpOptions: {
    // agent: new https.Agent({ rejectUnauthorized: false })
  },
  ...process.env.AWS_SAM_LOCAL && {
    endpoint: new aws.Endpoint('http://host.docker.internal:4002'),
  },
})