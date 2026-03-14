import { BadRequestException, Injectable } from "@nestjs/common"
import { CoversService } from "src/covers/covers.service"

type CoverCleanupStats = {
  storageStrategy: "fs" | "s3"
  storageLocation: string
  storedCovers: number | null
  storedSizeInBytes: number | null
  canDeleteAllCovers: boolean
}

type CoverCleanupDeletionResult = {
  deletedCovers: number
  deletedSizeInBytes: number
  failedCovers: number
  failedKeys: Array<{ key: string; message: string }>
}

@Injectable()
export class AdminCoversService {
  constructor(private readonly coversService: CoversService) {}

  async getCleanupStats(): Promise<CoverCleanupStats> {
    if (this.coversService.appConfig.COVERS_STORAGE_STRATEGY !== "fs") {
      return {
        storageStrategy: "s3",
        storageLocation: this.coversService.getStorageLocation(),
        storedCovers: null,
        storedSizeInBytes: null,
        canDeleteAllCovers: false,
      }
    }

    const storedCovers = await this.coversService.listStoredCovers()

    return {
      storageStrategy: "fs",
      storageLocation: this.coversService.getStorageLocation(),
      storedCovers: storedCovers.length,
      storedSizeInBytes: storedCovers.reduce(
        (sum, cover) => sum + cover.sizeInBytes,
        0,
      ),
      canDeleteAllCovers: true,
    }
  }

  async deleteAllCovers(): Promise<CoverCleanupDeletionResult> {
    if (this.coversService.appConfig.COVERS_STORAGE_STRATEGY !== "fs") {
      throw new BadRequestException(
        "Deleting all covers is only supported for fs storage",
      )
    }

    const storedCovers = await this.coversService.listStoredCovers()

    if (storedCovers.length === 0) {
      return {
        deletedCovers: 0,
        deletedSizeInBytes: 0,
        failedCovers: 0,
        failedKeys: [],
      }
    }

    const deleteResult = await this.coversService.deleteCovers(
      storedCovers.map((cover) => cover.key),
    )
    const deletedKeys = new Set(deleteResult.deletedKeys)
    const deletedSizeInBytes = storedCovers
      .filter((cover) => deletedKeys.has(cover.key))
      .reduce((sum, cover) => sum + cover.sizeInBytes, 0)

    return {
      deletedCovers: deleteResult.deletedKeys.length,
      deletedSizeInBytes,
      failedCovers: deleteResult.failedKeys.length,
      failedKeys: deleteResult.failedKeys,
    }
  }
}
