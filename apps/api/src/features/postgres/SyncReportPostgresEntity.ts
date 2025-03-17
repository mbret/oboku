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
