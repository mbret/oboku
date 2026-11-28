import { Module } from "@nestjs/common"
import { CouchModule } from "../couch/couch.module.js"
import { EmailModule } from "../email/email.module.js"
import { PluginsModule } from "../plugins/plugins.module.js"
import { QuotasModule } from "../quotas/quotas.module.js"
import { KindleDailySendsService } from "./kindle-daily-sends.service.js"
import { KindleController } from "./kindle.controller.js"
import { KindleService } from "./kindle.service.js"

@Module({
  imports: [CouchModule, PluginsModule, QuotasModule, EmailModule],
  providers: [KindleService, KindleDailySendsService],
  controllers: [KindleController],
})
export class KindleModule {}
