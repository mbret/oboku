import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { ConfigService } from "@nestjs/config"
import sharp from "sharp"
import { EnvironmentVariables } from "src/types"

const s3 = new S3Client()

export const saveCoverFromBufferToBucket = async (
  buffer: Buffer,
  objectKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  const resized = await sharp(buffer)
    .resize({
      withoutEnlargement: true,
      width: config.getOrThrow("COVER_MAXIMUM_SIZE_FOR_STORAGE", {
        infer: true,
      }).width,
      height: config.getOrThrow("COVER_MAXIMUM_SIZE_FOR_STORAGE", {
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
