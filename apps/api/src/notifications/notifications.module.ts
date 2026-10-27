import { Module } from "@nestjs/common"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { NotificationsService } from "./notifications.service.js"
import { NotificationsController } from "./notifications.controller.js"

@Module({
  imports: [PostgresModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
