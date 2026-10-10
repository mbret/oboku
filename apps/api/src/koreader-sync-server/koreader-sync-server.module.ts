import { Module } from "@nestjs/common"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { KoreaderSyncAuthGuard } from "./koreader-sync-auth.guard.js"
import { KoreaderSyncServerController } from "./koreader-sync-server.controller.js"
import { KoreaderSyncProtocolController } from "./koreader-sync-protocol.controller.js"
import { KoreaderSyncServerService } from "./koreader-sync-server.service.js"

@Module({
  imports: [PostgresModule],
  controllers: [KoreaderSyncProtocolController, KoreaderSyncServerController],
  providers: [KoreaderSyncServerService, KoreaderSyncAuthGuard],
})
export class KoreaderSyncServerModule {}
