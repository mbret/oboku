export type SendAdminEmailRequest = {
  subject: string
  body: string
  audienceType: "all" | "emails"
  emails?: string[]
}

/**
 * Returned as soon as the broadcast is accepted. Delivery runs in the
 * background (fire and forget); `recipientCount` is how many users it will be
 * sent to. Per-recipient success/failure is logged server-side.
 */
export type SendAdminEmailResponse = {
  recipientCount: number
}
