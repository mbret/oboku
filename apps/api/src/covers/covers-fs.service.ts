import { Injectable, Logger } from "@nestjs/common"
import { AppConfigService } from "src/config/AppConfigService"
import fs from "node:fs"
import path from "node:path"

const logger = new Logger("CoversFsService")
const MANAGED_COVER_PREFIXES = ["cover-", "collection-"] as const

@Injectable()
export class CoversFsService {
  constructor(private appConfig: AppConfigService) {
    logger.log(`Creating covers directory: ${this.appConfig.COVERS_DIR}`)
    fs.mkdirSync(this.appConfig.COVERS_DIR, { recursive: true })
  }

  async getCover(objectKey: string) {
    try {
      return await fs.promises.readFile(
        path.join(this.appConfig.COVERS_DIR, `${objectKey}.webp`),
      )
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null
      }

      throw error
    }
  }

  async saveCover(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    await fs.promises.writeFile(
      path.join(this.appConfig.COVERS_DIR, `${objectKey}.webp`),
      cover,
    )
  }

  async isCoverExist(objectKey: string) {
    return fs.promises
      .access(path.join(this.appConfig.COVERS_DIR, `${objectKey}.webp`))
      .then(() => true)
      .catch(() => false)
  }

  async deleteCovers(keys: string[]) {
    const deletedKeys: string[] = []
    const failedKeys: Array<{ key: string; message: string }> = []

    for (const key of keys) {
      try {
        await fs.promises.unlink(
          path.join(this.appConfig.COVERS_DIR, `${key}.webp`),
        )
        deletedKeys.push(key)
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          deletedKeys.push(key)
          continue
        }

        failedKeys.push({
          key,
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return { deletedKeys, failedKeys }
  }

  private isManagedCoverFileName(fileName: string) {
    return (
      fileName.endsWith(".webp") &&
      MANAGED_COVER_PREFIXES.some((prefix) => fileName.startsWith(prefix))
    )
  }

  async listStoredCovers() {
    const entries = await fs.promises.readdir(this.appConfig.COVERS_DIR, {
      withFileTypes: true,
    })

    return Promise.all(
      entries
        .filter(
          (entry) => entry.isFile() && this.isManagedCoverFileName(entry.name),
        )
        .map(async (entry) => {
          const fullPath = path.join(this.appConfig.COVERS_DIR, entry.name)
          const stats = await fs.promises.stat(fullPath)

          return {
            key: entry.name.replace(/\.webp$/u, ""),
            sizeInBytes: stats.size,
            lastModifiedAt: stats.mtime.toISOString(),
          }
        }),
    )
  }

  getStorageLocation() {
    return this.appConfig.COVERS_DIR
  }
}
