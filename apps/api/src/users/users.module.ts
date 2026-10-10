import { Module } from "@nestjs/common"
import { UsersService } from "./users.service.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
