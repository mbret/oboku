import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import * as sharp from "sharp"
import { AppConfigService } from "src/config/AppConfigService"

const s3 = new S3Client({
  region: "us-east-1",
})

export const saveCoverFromBufferToBucket = async (
  buffer: Buffer,
  objectKey: string,
  config: AppConfigService,
) => {
  const resized = await sharp(buffer)
    .resize({
      withoutEnlargement: true,
      width: config.config.getOrThrow("COVER_MAXIMUM_SIZE_FOR_STORAGE", {
        infer: true,
      }).width,
      height: config.config.getOrThrow("COVER_MAXIMUM_SIZE_FOR_STORAGE", {
        infer: true,
      }).height,
      fit: "inside",
    })
    .webp()
    .toBuffer()

  await s3.send(
    new PutObjectCommand({
      Bucket: "oboku-covers",
      Body: resized,
      Key: objectKey,
    }),
  )
}
