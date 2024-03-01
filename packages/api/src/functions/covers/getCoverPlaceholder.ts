import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"

export const getCoverPlaceholder = async (s3Client: S3Client) => {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.COVERS_BUCKET_NAME,
        Key: process.env.COVERS_PLACEHOLDER_BUCKET_KEY,
        ResponseContentType: ""
      })
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
