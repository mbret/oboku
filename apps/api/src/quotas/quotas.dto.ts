export class ProxiedDownloadQuotaResponseDto {
  /** What proxied downloads sent to all users this month, UTC. */
  usedBytes!: number
  quotaBytes!: number
  /** When the next month starts, UTC, as an ISO 8601 date-time. */
  resetsAt!: string
}
