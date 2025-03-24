import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

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

  @Column({ type: "boolean", default: false })
  emailVerified?: boolean
}
