import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { RefreshTokenPostgresEntity } from "src/features/postgres/entities"
import { MigrationService } from "./migration.service"

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
