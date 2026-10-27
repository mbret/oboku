import { ApiProperty } from "@nestjs/swagger"
import type { NotificationSeverity } from "@oboku/shared"
import { IsIn, IsOptional, IsString, MinLength } from "class-validator"
import { AudienceDto } from "../admin/audience.dto.js"

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

  @ApiProperty({ type: "null" })
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

export class CreateAdminNotificationDto extends AudienceDto {
  @IsString()
  @MinLength(1)
  title!: string

  @IsString()
  @IsOptional()
  body?: string

  @IsString()
  @IsIn(["info", "success", "warning", "error"])
  @IsOptional()
  severity?: NotificationSeverity
}

export class AdminNotificationSummaryDto {
  id!: number
  createdAt!: string
  kind!: "admin_broadcast"
  severity!: NotificationSeverity
  title!: string
  body!: string | null

  @ApiProperty({ type: "null" })
  data!: null

  deliveredCount!: number
}
