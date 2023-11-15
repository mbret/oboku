import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import createError from "http-errors"
import sharp from "sharp"

const s3 = new S3Client({
  region: `us-east-1`
})

const lambda: ValidatedEventAPIGatewayProxyEvent = async (event) => {
  const coverId = event.pathParameters?.id ?? ``
  const objectKey = `cover-${coverId}`
  const format = event.queryStringParameters?.format || "image/webp"

  let cover: Buffer | undefined

  try {
    const response = await s3.send(new GetObjectCommand({Bucket: "oboku-covers", Key: objectKey, ResponseContentType: ""}))

    if (!response.Body) {
      throw new Error("No body")
    }

    cover = (await response.Body.transformToByteArray()) as Buffer
  } catch (e) {
    if ((e as any)?.code === "NoSuchKey") {
      throw createError(404)
    } else {
      throw e
    }
  }

  const resized = sharp(cover).resize({
    width: 320,
    height: 320,
    fit: "inside"
  })

  const converted =
    format === "image/jpeg"
      ? resized.toFormat("jpeg").jpeg({
          force: true
        })
      : resized.webp()

  const buffer = await converted.toBuffer()

  return {
    statusCode: 200,
    body: buffer.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Length": buffer.byteLength,
      "Content-type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}

export const main = withMiddy(lambda)
