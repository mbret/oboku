import { Module } from "@nestjs/common"
import { PostgresModule } from "src/features/postgres/postgres.module"
import { NotificationsService } from "./notifications.service"
import { NotificationsController } from "./notifications.controller"

@Module({
  imports: [PostgresModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
