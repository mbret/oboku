import type {
  NotificationKind,
  NotificationSeverity,
  SyncFinishedNotificationData,
} from "@oboku/shared"
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

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

@Entity({ name: "communication" })
export class CommunicationPostgresEntity {
  @PrimaryGeneratedColumn("identity")
  id!: number

  @Column({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at!: Date

  @Column({ type: "text", nullable: true })
  content!: string | null

  @Column({ type: "text", nullable: true })
  type!: "info" | null
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
}
