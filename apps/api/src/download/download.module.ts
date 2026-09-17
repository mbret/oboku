import { Module } from "@nestjs/common"
import { CouchModule } from "src/couch/couch.module"
import { PluginsModule } from "src/plugins/plugins.module"
import { DownloadController } from "./download.controller"
import { DownloadService } from "./download.service"

@Module({
  imports: [CouchModule, PluginsModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}
