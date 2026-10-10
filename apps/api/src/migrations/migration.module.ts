import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { RefreshTokenPostgresEntity } from "../features/postgres/entities.js"
import { MigrationService } from "./migration.service.js"

@Module({
  imports: [
    CouchModule,
    CoversModule,
    TypeOrmModule.forFeature([RefreshTokenPostgresEntity]),
  ],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
