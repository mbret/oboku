import { Module } from "@nestjs/common"
import { CouchModule } from "../couch/couch.module.js"
import { ConnectorsController } from "./connectors.controller.js"
import { ConnectorsService } from "./connectors.service.js"

@Module({
  imports: [CouchModule],
  providers: [ConnectorsService],
  controllers: [ConnectorsController],
})
export class ConnectorsModule {}
