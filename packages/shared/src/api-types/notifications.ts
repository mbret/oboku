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
