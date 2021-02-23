import { lambda } from "../utils"
import {
  APIGatewayProxyEvent,
} from "aws-lambda"
import sharp from 'sharp'
import { PromiseReturnType } from "../types"
import { NotFoundError } from "@oboku/api-shared/src/errors"
import { S3 } from 'aws-sdk'

const s3 = new S3()

export const fn = lambda(async (event: APIGatewayProxyEvent) => {
  const coverId = event.pathParameters.id
  const format = event.queryStringParameters?.format || 'image/webp'

  const objectKey = `cover-${coverId}`

  let response: PromiseReturnType<ReturnType<typeof s3['getObject']>['promise']>

  let cover: Buffer | undefined

  console.log('foo')
  
  try {
    response = await s3
      .getObject({ Bucket: 'oboku-covers', Key: objectKey }).promise()
    if (response.Body instanceof Buffer) {
      cover = response.Body
    } else {
      throw new Error('body is not a buffer')
    }
  } catch (e) {
    if ((e as any)?.code === 'NoSuchKey') {
      throw new NotFoundError()
    } else {
      throw e
    }
  }

  const resized = sharp(cover)
    .resize({
      width: 320,
      height: 320,
      fit: 'inside'
    })
  const converted = format === 'image/jpeg' ? resized.toFormat('jpeg').jpeg({
    force: true
  }) : resized.webp()
  const buffer = await converted.toBuffer()

  return {
    statusCode: 200,
    body: buffer.toString('base64'),
    isBase64Encoded: true,
    headers: {
      // 'Content-type': format,
      'Content-Length': buffer.byteLength,
      'Content-type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
})