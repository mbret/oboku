import { Module } from "@nestjs/common"
import { CoversController } from "./covers.controller.js"
import { AppConfigModule } from "../config/config.module.js"
import { CoversService } from "./covers.service.js"
import { CoversFsService } from "./covers-fs.service.js"
import { CoversS3Service } from "./covers-s3.service.js"
import { CoversCleanupService } from "./covers-cleanup.service.js"
import { CouchModule } from "../couch/couch.module.js"

@Module({
  providers: [
    CoversFsService,
    CoversS3Service,
    CoversService,
    CoversCleanupService,
  ],
  exports: [CoversService],
  imports: [AppConfigModule, CouchModule],
  controllers: [CoversController],
})
export class CoversModule {}
