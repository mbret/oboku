import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { COVER_MAXIMUM_SIZE_FOR_STORAGE } from "src/constants"

const s3 = new S3Client()

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

  await s3.send(
    new PutObjectCommand({
      Bucket: "oboku-covers",
      Body: resized,
      Key: objectKey
    })
  )
}
