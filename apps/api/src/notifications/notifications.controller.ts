import { Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common"
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service.js"
import { OkResponseDto } from "../openapi/ok-response.dto.js"
import {
  AdminBroadcastNotificationDto,
  SyncFinishedNotificationDto,
  UnreadNotificationsCountResponseDto,
  type UserNotificationDto,
} from "./notifications.dto.js"
import { NotificationsService } from "./notifications.service.js"

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationsService,
    private readonly notificationPostgresService: NotificationPostgresService,
  ) {}

  @Get("/")
  @ApiExtraModels(AdminBroadcastNotificationDto, SyncFinishedNotificationDto)
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        oneOf: [
          { $ref: getSchemaPath(AdminBroadcastNotificationDto) },
          { $ref: getSchemaPath(SyncFinishedNotificationDto) },
        ],
        discriminator: {
          propertyName: "kind",
          mapping: {
            admin_broadcast: getSchemaPath(AdminBroadcastNotificationDto),
            sync_finished: getSchemaPath(SyncFinishedNotificationDto),
          },
        },
      },
    },
  })
  async list(@WithAuthUser() user: AuthUser): Promise<UserNotificationDto[]> {
    return this.notificationService.getNotificationsForUser({
      userId: user.userId,
    })
  }

  @Get("unread-count")
  async unreadCount(
    @WithAuthUser() user: AuthUser,
  ): Promise<UnreadNotificationsCountResponseDto> {
    const count = await this.notificationService.getUnreadCountForUser({
      userId: user.userId,
    })

    return { count }
  }

  @Post("seen")
  async markAllAsSeen(@WithAuthUser() user: AuthUser): Promise<OkResponseDto> {
    await this.notificationPostgresService.markAllNotificationsAsSeen({
      userId: user.userId,
    })

    return { ok: true }
  }

  @Post(":id/seen")
  async markAsSeen(
    @Param("id", ParseIntPipe) id: number,
    @WithAuthUser() user: AuthUser,
  ): Promise<OkResponseDto> {
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
  ): Promise<OkResponseDto> {
    await this.notificationPostgresService.archiveNotification({
      notificationId: id,
      userId: user.userId,
    })

    return { ok: true }
  }
}
