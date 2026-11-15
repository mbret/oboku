export class ProxiedDownloadQuotaResponseDto {
  /** What proxied downloads sent to all users this month, UTC. */
  usedBytes!: number
  quotaBytes!: number
  /** When the next month starts, UTC, as an ISO 8601 date-time. */
  resetsAt!: string
}

export class UserProxiedDownloadQuotaResponseDto extends ProxiedDownloadQuotaResponseDto {
  /** What proxied downloads sent to this user this month, UTC. */
  userUsedBytes!: number
  /** At most what the user may download this month, while the instance's quota lasts. */
  userQuotaBytes!: number
}
