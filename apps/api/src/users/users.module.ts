import { Module } from "@nestjs/common"
import { UsersService } from "./users.service"
import { PostgresModule } from "../features/postgres/postgres.module"
import { CouchModule } from "../couch/couch.module"
import { CoversModule } from "../covers/covers.module"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
