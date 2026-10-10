import { Module } from "@nestjs/common"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { KoreaderSyncAuthGuard } from "./koreader-sync-auth.guard.js"
import { KoreaderSyncController } from "./koreader-sync.controller.js"
import { KoreaderSyncProtocolController } from "./koreader-sync-protocol.controller.js"
import { KoreaderSyncService } from "./koreader-sync.service.js"

@Module({
  imports: [PostgresModule],
  controllers: [KoreaderSyncProtocolController, KoreaderSyncController],
  providers: [KoreaderSyncService, KoreaderSyncAuthGuard],
})
export class KoreaderSyncModule {}
