import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3 = new S3Client()

export const isCoverExist = async (coverObjectKey: string) => {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: "oboku-covers",
        Key: coverObjectKey
      })
    )

    return true
  } catch (e) {
    if ((e as any)?.$metadata?.httpStatusCode === 404) return false
    if ((e as any).code === "NotFound") return false
    throw e
  }
}
