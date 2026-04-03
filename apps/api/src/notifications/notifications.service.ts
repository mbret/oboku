import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import type {
  AdminNotificationSummary,
  CreateAdminNotificationRequest,
  CreateAdminNotificationResponse,
  GetAdminNotificationsResponse,
  GetNotificationsResponse,
  UserNotification,
} from "@oboku/shared"
import { syncFinishedNotificationDataSchema } from "@oboku/shared"
import {
  type AdminNotificationRow,
  NotificationPostgresService,
  type UserNotificationRow,
} from "src/features/postgres/notification-postgres.service"
import {
  normalizeEmail,
  UserPostgresService,
} from "src/features/postgres/user-postgres.service"

export const toIsoString = (value: Date | string | null) => {
  if (!value) {
    return null
  }

  return new Date(value).toISOString()
}

export const normalizeOptionalText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : null
}

const logger = new Logger("NotificationService")

const mapUserNotification = (
  row: UserNotificationRow,
): UserNotification | null => {
  const base = {
    id: row.notification_id,
    createdAt:
      toIsoString(row.notification_created_at) ?? new Date(0).toISOString(),
    severity: row.notification_severity,
    title: row.notification_title,
    body: row.notification_body,
    seenAt: toIsoString(row.delivery_seen_at),
    archivedAt: toIsoString(row.delivery_archived_at),
  }

  switch (row.notification_kind) {
    case "admin_broadcast":
      return { ...base, kind: "admin_broadcast", data: null }
    case "sync_finished": {
      const parsed = syncFinishedNotificationDataSchema.safeParse(
        row.notification_data,
      )

      if (!parsed.success) {
        logger.warn(
          `Skipping notification ${row.notification_id}: invalid sync_finished data`,
        )

        return null
      }

      return { ...base, kind: "sync_finished", data: parsed.data }
    }
  }
}

const mapAdminNotificationSummary = (
  row: AdminNotificationRow,
): AdminNotificationSummary => ({
  id: row.notification_id,
  createdAt:
    toIsoString(row.notification_created_at) ?? new Date(0).toISOString(),
  kind: "admin_broadcast",
  severity: row.notification_severity,
  title: row.notification_title,
  body: row.notification_body,
  data: null,
  deliveredCount: Number(row.delivered_count),
})

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationPostgresService: NotificationPostgresService,
    private readonly userPostgresService: UserPostgresService,
  ) {}

  async getNotificationsForUser({
    userId,
  }: {
    userId: number
  }): Promise<GetNotificationsResponse> {
    const rows = await this.notificationPostgresService.getUserNotificationRows(
      { userId },
    )

    return rows.reduce<UserNotification[]>((acc, row) => {
      const notification = mapUserNotification(row)

      if (notification) {
        acc.push(notification)
      }

      return acc
    }, [])
  }

  async getUnreadCountForUser({ userId }: { userId: number }): Promise<number> {
    return this.notificationPostgresService.getUnreadCount({ userId })
  }

  async getAdminNotifications(): Promise<GetAdminNotificationsResponse> {
    const rows = await this.notificationPostgresService.getAdminBroadcastRows()

    return rows.map(mapAdminNotificationSummary)
  }

  async resolveAudienceUserIds(
    input: CreateAdminNotificationRequest,
  ): Promise<number[]> {
    if (input.audienceType === "all") {
      return this.userPostgresService.getAllUserIds()
    }

    const emails = [
      ...new Set((input.emails ?? []).map(normalizeEmail)),
    ].filter((email) => email.length > 0)

    if (emails.length === 0) {
      throw new BadRequestException(
        "At least one email is required for targeted notifications",
      )
    }

    const userIds = await this.userPostgresService.getUserIdsByEmails(emails)

    if (userIds.length === 0) {
      throw new BadRequestException(
        "None of the provided emails match existing users",
      )
    }

    return userIds
  }

  async sendAdminBroadcast(
    input: CreateAdminNotificationRequest,
  ): Promise<CreateAdminNotificationResponse> {
    const title = normalizeOptionalText(input.title)

    if (!title) {
      throw new BadRequestException("Title is required")
    }

    const targetUserIds = await this.resolveAudienceUserIds(input)

    const notification =
      await this.notificationPostgresService.saveNotification({
        kind: "admin_broadcast",
        severity: input.severity ?? "info",
        title,
        body: normalizeOptionalText(input.body),
        data: null,
      })

    await this.notificationPostgresService.createDeliveries({
      notificationId: notification.id,
      userIds: targetUserIds,
    })

    return {
      id: notification.id,
      createdAt: notification.created_at.toISOString(),
      kind: "admin_broadcast",
      severity: notification.severity,
      title: notification.title,
      body: notification.body,
      data: null,
      deliveredCount: targetUserIds.length,
    }
  }

  async sendSyncFinishedNotification({
    userId,
    dataSourceId,
    state,
  }: {
    userId: number
    dataSourceId: string
    state: "success" | "error"
  }) {
    try {
      const notification =
        await this.notificationPostgresService.saveNotification({
          kind: "sync_finished",
          severity: state === "success" ? "success" : "error",
          title: "Sync finished",
          body: null,
          data: { datasourceId: dataSourceId, state },
        })

      await this.notificationPostgresService.createDeliveries({
        notificationId: notification.id,
        userIds: [userId],
      })
    } catch (error) {
      logger.error(
        `Unable to create sync notification for ${dataSourceId}`,
        error instanceof Error ? error.stack : error,
      )
    }
  }
}
