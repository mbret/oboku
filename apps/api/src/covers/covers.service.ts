import { Injectable, Logger } from "@nestjs/common"
import { from, of, switchMap, tap } from "rxjs"
import sharp from "sharp"
import { AppConfigService } from "src/config/AppConfigService"
import fs from "node:fs"
import path from "node:path"
import { CoversFsService } from "./covers-fs.service"
import { CoversS3Service } from "./covers-s3.service"

const logger = new Logger("CoversService")

export type StoredCover = {
  key: string
  sizeInBytes: number
  lastModifiedAt: string | null
}

@Injectable()
export class CoversService {
  constructor(
    public appConfig: AppConfigService,
    private fsService: CoversFsService,
    private s3Service: CoversS3Service,
  ) {}

  private get backend() {
    return this.appConfig.COVERS_STORAGE_STRATEGY === "s3"
      ? this.s3Service
      : this.fsService
  }

  private getCoverPlaceholder() {
    return fs.promises.readFile(
      path.join(this.appConfig.ASSETS_DIR, "cover-placeholder.jpg"),
    )
  }

  getCover(id: string) {
    return from(this.backend.getCover(id)).pipe(
      switchMap((cover) => {
        if (cover) {
          return of(cover)
        }

        return from(this.getCoverPlaceholder())
      }),
    )
  }

  saveCover(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    const resized$ = this.resizeCover(cover, {
      width: this.appConfig.COVERS_MAXIMUM_SIZE_FOR_STORAGE.width,
      height: this.appConfig.COVERS_MAXIMUM_SIZE_FOR_STORAGE.height,
      format: "image/webp",
    })

    return resized$.pipe(
      switchMap((resized) =>
        from(this.backend.saveCover(resized, objectKey)).pipe(
          tap(() => {
            const coverSize = Buffer.byteLength(resized)

            logger.debug(
              `Saved cover ${objectKey} with a size of ${(coverSize / 1024).toFixed(2)} KB`,
            )
          }),
        ),
      ),
    )
  }

  isCoverExist(objectKey: string) {
    return from(this.backend.isCoverExist(objectKey))
  }

  async deleteCovers(keys: string[]) {
    return this.backend.deleteCovers(keys)
  }

  async listStoredCovers(): Promise<StoredCover[]> {
    return this.backend.listStoredCovers()
  }

  getStorageLocation() {
    return this.backend.getStorageLocation()
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

    return from(converted.toBuffer())
  }
}
