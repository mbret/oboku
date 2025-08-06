import { Module, OnModuleInit } from "@nestjs/common"
import { AppConfigService } from "src/config/AppConfigService"
import { StorageService } from "./storage.service"
import fs from "node:fs"

@Module({
  imports: [],
  providers: [StorageService, AppConfigService],
  exports: [],
})
export class StorageModule implements OnModuleInit {
  constructor(private configService: AppConfigService) {}

  /**
   * Prepare all tmp folders
   */
  onModuleInit() {
    if (!fs.existsSync(this.configService.TMP_DIR)) {
      fs.mkdirSync(this.configService.TMP_DIR, { recursive: true })
    }

    // make sure to cleanup on each restart
    fs.rmSync(this.configService.TMP_DIR, { recursive: true, force: true })

    fs.mkdirSync(this.configService.TMP_DIR_BOOKS, { recursive: true })
  }
}
