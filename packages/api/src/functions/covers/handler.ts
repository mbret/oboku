import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { middyfy } from "@libs/lambda"
import { PromiseReturnType } from "@libs/types"
import { S3 } from "aws-sdk"
import createError from "http-errors"
import sharp from "sharp"

const s3 = new S3({
  region: `us-east-1`
})

const lambda: ValidatedEventAPIGatewayProxyEvent = async (event) => {
  const coverId = event.pathParameters?.id ?? ``
  const objectKey = `cover-${coverId}`
  const format = event.queryStringParameters?.format || "image/webp"

  let response: PromiseReturnType<
    ReturnType<(typeof s3)["getObject"]>["promise"]
  >

  let cover: Buffer | undefined

  try {
    response = await s3
      .getObject({ Bucket: "oboku-covers", Key: objectKey })
      .promise()

    if (response.Body instanceof Buffer) {
      cover = response.Body
    } else {
      throw new Error("body is not a buffer")
    }
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

export const main = middyfy(lambda)
