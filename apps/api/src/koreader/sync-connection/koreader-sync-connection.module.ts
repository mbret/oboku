import { Module } from "@nestjs/common"
import { PostgresModule } from "../../features/postgres/postgres.module.js"
import { AtRestCipher } from "../../crypto/at-rest-cipher.js"
import { KoreaderSyncConnectionController } from "./koreader-sync-connection.controller.js"
import { KoreaderSyncConnectionService } from "./koreader-sync-connection.service.js"

@Module({
  imports: [PostgresModule],
  controllers: [KoreaderSyncConnectionController],
  providers: [KoreaderSyncConnectionService, AtRestCipher],
})
export class KoreaderSyncConnectionModule {}
