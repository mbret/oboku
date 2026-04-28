import { Module } from "@nestjs/common"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { MigrationService } from "./migration.service"

@Module({
  imports: [CouchModule, CoversModule],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
