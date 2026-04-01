import { z } from "zod"

export type NotificationSeverity = "info" | "success" | "warning" | "error"

export const syncFinishedNotificationDataSchema = z.object({
  datasourceId: z.string(),
  state: z.enum(["success", "error"]),
})

export type SyncFinishedNotificationData = z.infer<
  typeof syncFinishedNotificationDataSchema
>

type BaseUserNotification = {
  id: number
  createdAt: string
  severity: NotificationSeverity
  title: string
  body: string | null
  seenAt: string | null
  archivedAt: string | null
}

export type UserNotification =
  | (BaseUserNotification & {
      kind: "admin_broadcast"
      data: null
    })
  | (BaseUserNotification & {
      kind: "sync_finished"
      data: SyncFinishedNotificationData
    })

export type NotificationKind = UserNotification["kind"]

export type GetNotificationsResponse = UserNotification[]

export type CreateAdminNotificationRequest = {
  title: string
  body?: string
  severity?: NotificationSeverity
  audienceType: "all" | "emails"
  emails?: string[]
}

export type AdminNotificationSummary = {
  id: number
  createdAt: string
  kind: "admin_broadcast"
  severity: NotificationSeverity
  title: string
  body: string | null
  data: null
  deliveredCount: number
}

export type GetAdminNotificationsResponse = AdminNotificationSummary[]

export type CreateAdminNotificationResponse = AdminNotificationSummary
