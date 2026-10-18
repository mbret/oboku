import { z } from "zod"

export type NotificationSeverity = "info" | "success" | "warning" | "error"

export const syncFinishedNotificationDataSchema = z.object({
  datasourceId: z.string(),
  state: z.enum(["success", "error"]),
})

export type SyncFinishedNotificationData = z.infer<
  typeof syncFinishedNotificationDataSchema
>

export type NotificationKind = "admin_broadcast" | "sync_finished"

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
