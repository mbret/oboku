import {
  GetObjectCommand,
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import { from, of, switchMap } from "rxjs"
import * as sharp from "sharp"
import { AppConfigService } from "src/config/AppConfigService"
import * as fs from "node:fs"
import * as path from "node:path"

@Injectable()
export class CoversService {
  private s3Client: S3Client | undefined

  constructor(public appConfig: AppConfigService) {
    const AWS_ACCESS_KEY_ID = this.appConfig.AWS_ACCESS_KEY_ID
    const AWS_SECRET_ACCESS_KEY = this.appConfig.AWS_SECRET_ACCESS_KEY

    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: `us-east-1`,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      })
    }
  }

  getCoverFromS3 = async (objectKey: string) => {
    if (!this.s3Client) {
      throw new Error("No s3 client")
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.appConfig.COVERS_BUCKET_NAME ?? "",
          Key: objectKey,
          ResponseContentType: "",
        }),
      )

      if (!response.Body) {
        throw new Error("No body")
      }

      return await response.Body.transformToByteArray()
    } catch (e) {
      if (
        (e as any)?.code === "NoSuchKey" ||
        (e as any)?.Code === "NoSuchKey"
      ) {
        return null
      }

      throw e
    }
  }

  getCoverPlaceholder = async () => {
    return fs.promises.readFile(
      path.join(this.appConfig.ASSETS_DIR, "cover-placeholder.jpg"),
    )
  }

  getCover(id: string) {
    const cover$ = from(this.getCoverFromS3(id))

    return cover$.pipe(
      switchMap((cover) => {
        if (cover) {
          return of(cover)
        }

        return from(this.getCoverPlaceholder())
      }),
    )
  }

  saveCoverTos3(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    if (!this.s3Client) {
      throw new Error("No s3 client")
    }

    return from(
      this.s3Client.send(
        new PutObjectCommand({
          Bucket: "oboku-covers",
          Body: cover,
          Key: objectKey,
        }),
      ),
    )
  }

  saveCover(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    const resized$ = this.resizeCover(cover, {
      width: this.appConfig.COVER_MAXIMUM_SIZE_FOR_STORAGE.width,
      height: this.appConfig.COVER_MAXIMUM_SIZE_FOR_STORAGE.height,
      format: "image/webp",
    })

    return resized$.pipe(
      switchMap((resized) => this.saveCoverTos3(resized, objectKey)),
    )
  }

  async isCoverExistS3(objectKey: string) {
    if (!this.s3Client) {
      throw new Error("No s3 client")
    }

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: "oboku-covers",
          Key: objectKey,
        }),
      )

      return true
    } catch (e) {
      if ((e as any)?.$metadata?.httpStatusCode === 404) return false
      if ((e as any).code === "NotFound") return false
      throw e
    }
  }

  isCoverExist(objectKey: string) {
    return from(this.isCoverExistS3(objectKey))
  }

  resizeCover(
    cover: Uint8Array<ArrayBufferLike>,
    {
      height,
      width,
      format,
    }: { width: number; height: number; format: string },
  ) {
    const resized = sharp(cover).resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })

    const converted =
      format === "image/jpeg"
        ? resized.toFormat("jpeg").jpeg({
            force: true,
          })
        : resized.webp()

    const buffer$ = from(converted.toBuffer())

    return buffer$
  }
}
