import { Module } from "@nestjs/common"
import { LibrarySyncsController } from "./library-sync.controller.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { LibrarySyncService } from "./library-sync.service.js"
import { NotificationsModule } from "../notifications/notifications.module.js"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule, NotificationsModule],
  providers: [LibrarySyncService],
  controllers: [LibrarySyncsController],
  exports: [],
})
export class LibrarySyncModule {}
