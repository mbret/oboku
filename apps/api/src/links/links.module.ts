import { Module } from "@nestjs/common"
import { CouchModule } from "../couch/couch.module.js"
import { QuotasModule } from "../quotas/quotas.module.js"
import { LinksController } from "./links.controller.js"
import { LinksService } from "./links.service.js"

@Module({
  imports: [CouchModule, QuotasModule],
  providers: [LinksService],
  controllers: [LinksController],
})
export class LinksModule {}
