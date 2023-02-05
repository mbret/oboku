import { S3 } from "aws-sdk"
import sharp from "sharp"
import { COVER_MAXIMUM_SIZE_FOR_STORAGE } from "../../constants"

const s3 = new S3()

export const saveCoverFromBufferToBucket = async (
  buffer: Buffer,
  objectKey: string
) => {
  const resized = await sharp(buffer)
    .resize({
      withoutEnlargement: true,
      width: COVER_MAXIMUM_SIZE_FOR_STORAGE.width,
      height: COVER_MAXIMUM_SIZE_FOR_STORAGE.height,
      fit: "inside"
    })
    .webp()
    .toBuffer()

  await s3
    .putObject({
      Bucket: "oboku-covers",
      Body: resized,
      Key: objectKey
    })
    .promise()
}
