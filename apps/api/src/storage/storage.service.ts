import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { AppConfigService } from "src/config/AppConfigService"
import fs from "node:fs"
import path from "node:path"
import { formatDuration } from "src/lib/utils"

@Injectable()
export class StorageService {
  private logger = new Logger(StorageService.name)

  constructor(private appConfigService: AppConfigService) {}

  @Cron("*/10 * * * *") // Every 10 minutes
  async cleanupOldTempFiles() {
    const maxAge = 1 * 60 * 60 * 1000 // 1 hours
    const files = await fs.promises.readdir(this.appConfigService.TMP_DIR_BOOKS)

    this.logger.log(
      `Running cleanup of tmp folder ${this.appConfigService.TMP_DIR_BOOKS} for ${files.length} files`,
    )

    for (const file of files) {
      const filePath = path.join(this.appConfigService.TMP_DIR_BOOKS, file)
      const stats = await fs.promises.stat(filePath)
      const fileAge = Date.now() - stats.mtime.getTime()

      this.logger.log(
        `File: ${filePath}, Age: ${formatDuration(fileAge)}, Max age: ${formatDuration(maxAge)}`,
      )

      if (fileAge > maxAge) {
        await fs.promises.unlink(filePath).catch(console.error)
      }
    }
  }
}
