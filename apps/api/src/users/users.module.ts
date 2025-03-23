import { Module } from "@nestjs/common"
import { UsersService } from "./users.service"
import { PostgresModule } from "../features/postgres/postgres.module"

@Module({
  imports: [PostgresModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
