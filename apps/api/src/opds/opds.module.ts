import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { PluginsModule } from "../plugins/plugins.module.js"
import { SourceConnectionsModule } from "../source-connections/source-connections.module.js"
import { QuotasModule } from "../quotas/quotas.module.js"
import { OpdsAuthenticationController } from "./opds-authentication.controller.js"
import { OpdsBasicAuthGuard } from "./opds-basic-auth.guard.js"
import { OpdsCatalogController } from "./opds-catalog.controller.js"
import { OpdsAuthService } from "./opds-auth.service.js"
import { OpdsBooksService } from "./opds-books.service.js"
import { OpdsServersController } from "./opds-servers.controller.js"
import { OpdsServersService } from "./opds-servers.service.js"

@Module({
  imports: [
    PostgresModule,
    InstanceConfigModule,
    CouchModule,
    CoversModule,
    PluginsModule,
    SourceConnectionsModule,
    QuotasModule,
  ],
  controllers: [
    OpdsCatalogController,
    OpdsAuthenticationController,
    OpdsServersController,
  ],
  providers: [
    OpdsServersService,
    OpdsAuthService,
    OpdsBooksService,
    OpdsBasicAuthGuard,
  ],
})
export class OpdsModule {}
