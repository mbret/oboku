import { Module } from "@nestjs/common"
import { AdminModule } from "../admin/admin.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { OpdsBasicAuthGuard } from "./opds-basic-auth.guard.js"
import { OpdsCatalogController } from "./opds-catalog.controller.js"
import { OpdsCatalogService } from "./opds-catalog.service.js"
import { OpdsServersController } from "./opds-servers.controller.js"
import { OpdsServersService } from "./opds-servers.service.js"

@Module({
  imports: [PostgresModule, AdminModule],
  controllers: [OpdsCatalogController, OpdsServersController],
  providers: [OpdsServersService, OpdsCatalogService, OpdsBasicAuthGuard],
})
export class OpdsModule {}
