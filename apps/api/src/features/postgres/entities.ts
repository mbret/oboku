import type {
  NotificationKind,
  NotificationSeverity,
  SyncFinishedNotificationData,
} from "@oboku/shared"
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm"

@Entity({ name: "sync_reports" })
export class SyncReportPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({ type: "timestamp with time zone" })
  created_at!: Date

  @Column({ type: "timestamp with time zone" })
  ended_at!: Date

  @Column({ type: "json" })
  report!: object

  @Column({ type: "uuid" })
  datasource_id!: string

  @Column({ type: "text" })
  user_name!: string

  @Column({ type: "text" })
  state!: string

  @Column({ type: "boolean", nullable: true })
  has_different_provider_credentials!: boolean | null
}

@Entity({ name: "notifications" })
export class NotificationPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at!: Date

  @Column({ type: "text" })
  kind!: NotificationKind

  @Column({ type: "text", default: "info" })
  severity!: NotificationSeverity

  @Column({ type: "text" })
  title!: string

  @Column({ type: "text", nullable: true })
  body!: string | null

  @Column({ type: "jsonb", nullable: true })
  data!: SyncFinishedNotificationData | null
}

@Entity({ name: "notification_deliveries" })
@Index(["notification_id", "user_id"], { unique: true })
@Index(["user_id", "archived_at"])
@Index(["user_id", "seen_at"])
export class NotificationDeliveryPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({ type: "integer" })
  notification_id!: number

  @Column({ type: "integer" })
  user_id!: number

  @Column({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at!: Date

  @Column({ type: "timestamp with time zone", nullable: true })
  seen_at!: Date | null

  @Column({ type: "timestamp with time zone", nullable: true })
  archived_at!: Date | null
}

@Entity({ name: "users" })
export class UserPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({ type: "text" })
  email!: string

  @Column({ type: "text" })
  username!: string

  @Column({ type: "text", nullable: true })
  password?: string

  /**
   * This flag represents whether Oboku trusts the local email/password side of
   * this merged account as having proven mailbox ownership.
   *
   * Expected behavior:
   * - Local password sign-in should only be allowed when this is true.
   * - OAuth providers may still sign the user in even when this is false, as
   *   long as the provider itself proves the email is verified for that login.
   * - Completing Oboku's own email verification flow should set this to true.
   * - Provider sign-ins should not set this to true, even for newly created
   *   provider-only users, because provider trust is evaluated fresh on each
   *   provider login.
   *
   * Important edge case:
   * - Do not automatically set this to true from any provider login.
   * - Otherwise a legacy or maliciously pre-claimed local password could become
   *   valid again after the real mailbox owner later signs in with Google or
   *   another trusted provider.
   */
  @Column({ type: "boolean", default: false })
  emailVerified?: boolean

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date
}

/**
 * Append-only log of issued refresh tokens. One row = one token, never mutated
 * except to stamp `superseded_at` when it is rotated out. A session (one
 * installation) is the chain of rows sharing `user_id` + `installation_id`; the
 * single row with `superseded_at IS NULL` holds the currently-active token.
 *
 * Rotation inserts a new row rather than overwriting, so `created_at` is a true
 * issue timestamp and doubles as the per-token expiry anchor (a token is past
 * its cap once `created_at` is older than the configured max age).
 */
@Entity({ name: "refresh_tokens" })
@Index(["token_hash"], { unique: true })
@Index(["user_id", "installation_id"])
@Index(["created_at"])
export class RefreshTokenPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({ type: "integer" })
  user_id!: number

  @Column({ type: "text" })
  installation_id!: string

  /** Hash of this issued token. */
  @Column({ type: "text" })
  token_hash!: string

  /**
   * When this token was issued. Never updated — each rotation inserts a new row
   * — so it is a genuine creation timestamp and the per-token expiry anchor:
   * the token is past its cap once `created_at + max age` is in the past.
   */
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date

  /**
   * When this token was rotated out (a successor was minted). Null while the
   * token is the active one for its session. Once set, the token is accepted
   * only through the grace window (`superseded_at + grace`) for lost
   * rotation-response and concurrent-refresh retries, during which it resolves
   * to its successor. Presented after that, this one token is refused as a
   * stale replay — but the rest of the chain (the active token) is left intact.
   */
  @Column({ type: "timestamp with time zone", nullable: true })
  superseded_at!: Date | null

  /**
   * The successor token minted when this token was rotated out, encrypted with
   * AES-256-GCM under a per-process in-memory key (never persisted). Held only
   * for the grace window so concurrent / retried refreshes of this same token
   * converge on one successor instead of each minting a new one. Undecryptable
   * after a restart (the key is gone), which is fine: callers fall back to
   * minting a fresh successor.
   *
   * IMPORTANT — this convergence is single-instance only. The key lives in one
   * process's memory, so a sibling instance cannot decrypt this ciphertext and
   * would mint a divergent successor, leaving two active tokens for the same
   * session. The API must therefore run as a single instance (no horizontal
   * scaling / load-balanced replicas). See the self-hosting docs.
   */
  @Column({ type: "text", nullable: true })
  successor_token!: string | null
}
