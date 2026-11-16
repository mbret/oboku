import { Module } from "@nestjs/common"
import { CouchModule } from "../couch/couch.module.js"
import { PluginsModule } from "../plugins/plugins.module.js"
import { QuotasModule } from "../quotas/quotas.module.js"
import { LinksController } from "./links.controller.js"
import { LinksService } from "./links.service.js"

@Module({
  imports: [CouchModule, PluginsModule, QuotasModule],
  providers: [LinksService],
  controllers: [LinksController],
})
export class LinksModule {}
