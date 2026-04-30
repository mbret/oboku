import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/config/AppConfigService"

@Injectable()
export class CoversS3Service {
  private s3Client: S3Client | undefined

  constructor(private appConfig: AppConfigService) {
    if (this.appConfig.COVERS_STORAGE_STRATEGY === "s3") {
      this.s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
          accessKeyId: this.appConfig.AWS_ACCESS_KEY_ID ?? "",
          secretAccessKey: this.appConfig.AWS_SECRET_ACCESS_KEY ?? "",
        },
      })
    }
  }

  private requireClient() {
    if (!this.s3Client) {
      throw new Error("No s3 client")
    }

    return this.s3Client
  }

  private get bucketName() {
    return this.appConfig.COVERS_BUCKET_NAME ?? ""
  }

  async getCover(objectKey: string) {
    const client = this.requireClient()

    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          ResponseContentType: "",
        }),
      )

      if (!response.Body) {
        throw new Error("No body")
      }

      return await response.Body.transformToByteArray()
    } catch (e) {
      if (e instanceof NoSuchKey) {
        return null
      }

      throw e
    }
  }

  async saveCover(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    const client = this.requireClient()

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Body: cover,
        Key: objectKey,
      }),
    )
  }

  async isCoverExist(objectKey: string) {
    const client = this.requireClient()

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      )

      return true
    } catch (e) {
      // Any 404 from S3 (NotFound / NoSuchKey / NoSuchBucket / etc.) is
      // treated as "cover absent" to preserve prior behaviour. Non-404
      // failures still propagate so configuration issues surface.
      if (
        e instanceof S3ServiceException &&
        e.$metadata.httpStatusCode === 404
      ) {
        return false
      }
      throw e
    }
  }

  async deleteCovers(keys: string[]) {
    const client = this.requireClient()
    const batchSize = 1000
    const deletedKeys: string[] = []
    const failedKeys: Array<{ key: string; message: string }> = []

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)

      try {
        const result = await client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
            },
          }),
        )

        const errorKeys = new Set((result.Errors ?? []).map((e) => e.Key))

        for (const key of batch) {
          if (errorKeys.has(key)) {
            const s3Error = result.Errors?.find((e) => e.Key === key)
            failedKeys.push({
              key,
              message: s3Error?.Message ?? "Unknown error",
            })
          } else {
            deletedKeys.push(key)
          }
        }
      } catch (error) {
        for (const key of batch) {
          failedKeys.push({
            key,
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }
    }

    return { deletedKeys, failedKeys }
  }

  async listStoredCovers(): Promise<never> {
    throw new Error("Listing stored covers is only supported for fs storage")
  }

  getStorageLocation() {
    return `s3://${this.bucketName}`
  }
}
