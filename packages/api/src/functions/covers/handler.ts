import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { S3Client } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { getCover } from "./getCover"
import { getCoverPlaceholder } from "./getCoverPlaceholder"
import createError from "http-errors"

const s3 = new S3Client({
  region: `us-east-1`
})

const lambda: ValidatedEventAPIGatewayProxyEvent = async (event) => {
  const objectKey = event.pathParameters?.id ?? ``
  const format = event.queryStringParameters?.format || "image/webp"

  const userCover = await getCover(s3, objectKey)
  const cover = userCover ? userCover : await getCoverPlaceholder(s3)

  if (!cover) {
    throw createError(404)
  }

  const resized = sharp(cover).resize({
    width: 600,
    height: 600,
    fit: "inside",
    withoutEnlargement: true  
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

export const main = withMiddy(lambda, {
  withJsonBodyParser: false
})
