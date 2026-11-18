import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { CouchModule } from "../couch/couch.module.js"
import { AtRestCipher } from "../crypto/at-rest-cipher.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { ConnectorConnectionController } from "./connectors/connector-connection.controller.js"
import { ConnectorConnectionService } from "./connectors/connector-connection.service.js"
import { GoogleConnectionController } from "./google/google-connection.controller.js"
import { GoogleConnectionService } from "./google/google-connection.service.js"
import { ProviderConnectionsService } from "./provider-connections.service.js"

@Module({
  imports: [PostgresModule, InstanceConfigModule, CouchModule],
  controllers: [GoogleConnectionController, ConnectorConnectionController],
  providers: [
    ProviderConnectionsService,
    GoogleConnectionService,
    ConnectorConnectionService,
    AtRestCipher,
  ],
  exports: [GoogleConnectionService, ConnectorConnectionService],
})
export class ProviderConnectionsModule {}
