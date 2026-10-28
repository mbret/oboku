import { Module } from "@nestjs/common"
import { AdminModule } from "../admin/admin.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { OpdsServersController } from "./opds-servers.controller.js"
import { OpdsServersService } from "./opds-servers.service.js"

@Module({
  imports: [PostgresModule, AdminModule],
  controllers: [OpdsServersController],
  providers: [OpdsServersService],
})
export class OpdsModule {}
