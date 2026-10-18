import { ApiProperty } from "@nestjs/swagger"
import type { NotificationSeverity } from "@oboku/shared"

export class SyncFinishedNotificationDataDto {
  datasourceId!: string
  state!: "success" | "error"
}

class BaseUserNotificationDto {
  id!: number
  createdAt!: string
  severity!: NotificationSeverity
  title!: string
  body!: string | null
  seenAt!: string | null
  archivedAt!: string | null
}

export class AdminBroadcastNotificationDto extends BaseUserNotificationDto {
  kind!: "admin_broadcast"

  // OpenAPI 3.0 has no `null` type: `type: "null"` would generate `unknown`.
  @ApiProperty({ nullable: true, enum: [null] })
  data!: null
}

export class SyncFinishedNotificationDto extends BaseUserNotificationDto {
  kind!: "sync_finished"
  data!: SyncFinishedNotificationDataDto
}

export type UserNotificationDto =
  | AdminBroadcastNotificationDto
  | SyncFinishedNotificationDto

export class UnreadNotificationsCountResponseDto {
  count!: number
}
