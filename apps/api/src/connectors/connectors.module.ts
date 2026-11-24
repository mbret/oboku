import { Module } from "@nestjs/common"
import { ConnectorsController } from "./connectors.controller.js"
import { ConnectorsService } from "./connectors.service.js"

@Module({
  providers: [ConnectorsService],
  controllers: [ConnectorsController],
})
export class ConnectorsModule {}
