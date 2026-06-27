export type SendAdminEmailRequest = {
  subject: string
  body: string
  audienceType: "all" | "emails"
  emails?: string[]
}

export type SendAdminEmailResponse = {
  recipientCount: number
  deliveredCount: number
  failedCount: number
}
