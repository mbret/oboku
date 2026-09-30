import { Module } from "@nestjs/common"
import { PostgresModule } from "../features/postgres/postgres.module"
import { KoreaderSyncAuthGuard } from "./koreader-sync-auth.guard"
import { KoreaderSyncController } from "./koreader-sync.controller"
import { KoreaderSyncProtocolController } from "./koreader-sync-protocol.controller"
import { KoreaderSyncService } from "./koreader-sync.service"

@Module({
  imports: [PostgresModule],
  controllers: [KoreaderSyncProtocolController, KoreaderSyncController],
  providers: [KoreaderSyncService, KoreaderSyncAuthGuard],
})
export class KoreaderSyncModule {}
