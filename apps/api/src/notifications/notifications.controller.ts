import { Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common"
import type { GetNotificationsResponse } from "@oboku/shared"
import { AuthUser, WithAuthUser } from "src/auth/auth.guard"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service"
import { NotificationsService } from "./notifications.service"

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationsService,
    private readonly notificationPostgresService: NotificationPostgresService,
  ) {}

  @Get("/")
  async all(@WithAuthUser() user: AuthUser): Promise<GetNotificationsResponse> {
    return this.notificationService.getNotificationsForUser({
      userId: user.userId,
    })
  }

  @Post("seen")
  async markAllAsSeen(@WithAuthUser() user: AuthUser) {
    await this.notificationPostgresService.markAllNotificationsAsSeen({
      userId: user.userId,
    })

    return { ok: true }
  }

  @Post(":id/seen")
  async markAsSeen(
    @Param("id", ParseIntPipe) id: number,
    @WithAuthUser() user: AuthUser,
  ) {
    await this.notificationPostgresService.markNotificationAsSeen({
      notificationId: id,
      userId: user.userId,
    })

    return { ok: true }
  }

  @Post(":id/archive")
  async archive(
    @Param("id", ParseIntPipe) id: number,
    @WithAuthUser() user: AuthUser,
  ) {
    await this.notificationPostgresService.archiveNotification({
      notificationId: id,
      userId: user.userId,
    })

    return { ok: true }
  }
}
