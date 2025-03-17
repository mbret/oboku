import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/features/config/types"

export const getCover = async (
  s3Client: S3Client,
  objectKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: config.getOrThrow("COVERS_BUCKET_NAME", { infer: true }),
        Key: objectKey,
        ResponseContentType: "",
      }),
    )

    if (!response.Body) {
      throw new Error("No body")
    }

    return await response.Body.transformToByteArray()
  } catch (e) {
    if ((e as any)?.code === "NoSuchKey" || (e as any)?.Code === "NoSuchKey") {
      return null
    }

    throw e
  }
}
