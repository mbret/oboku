import { APIGatewayProxyEvent } from "aws-lambda"
import fs from "fs"
import unzipper from 'unzipper'
import { READER_SUPPORTED_MIME_TYPES } from "@oboku/shared"

export const waitForRandomTime = (min: number, max: number) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)))

export const getNormalizedHeader = (event: Pick<APIGatewayProxyEvent, `headers`>, header: string): string | null | undefined => {
  const realKey = Object.keys(event.headers).find(key => key.toLowerCase() === header.toLowerCase()) || header

  return event.headers[realKey]
}

export const detectMimeTypeFromContent = async (filepath: string): Promise<typeof READER_SUPPORTED_MIME_TYPES[number] | undefined> => {
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

export const asError = (e: unknown) => {

  return {
    message: hasMessage(e) ? e.message : ``
  }
}

const hasMessage = <MessageError extends { message: string }>(e: MessageError | unknown): e is MessageError => {
  return `message` in (e as any) && typeof (e as any).message === `string`
}