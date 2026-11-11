import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { AtRestCipher } from "../crypto/at-rest-cipher.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { GoogleConnectionController } from "./google/google-connection.controller.js"
import { GoogleConnectionService } from "./google/google-connection.service.js"
import { ProviderConnectionsService } from "./provider-connections.service.js"

@Module({
  imports: [PostgresModule, InstanceConfigModule],
  controllers: [GoogleConnectionController],
  providers: [
    ProviderConnectionsService,
    GoogleConnectionService,
    AtRestCipher,
  ],
})
export class ProviderConnectionsModule {}
