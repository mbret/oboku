import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import type { SyncReportEntryDto } from "../../datasource/sync/sync-report.dto.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import { SyncReportPostgresEntity } from "./entities.js"

@Injectable()
export class SyncReportPostgresService {
  constructor(
    private readonly appConfig: AppConfigService,
    @InjectRepository(SyncReportPostgresEntity)
    private readonly repository: Repository<SyncReportPostgresEntity>,
  ) {}

  async save(data: {
    created_at: string
    ended_at: string
    state: "success" | "error"
    report: SyncReportEntryDto[]
    datasource_id: string
    user_name: string
    has_different_provider_credentials?: boolean
  }): Promise<SyncReportPostgresEntity> {
    const entity = this.repository.create(data)

    const savedEntity = await this.repository.save(entity)

    await this.cleanupOldReports(
      data.user_name,
      this.appConfig.POSTGRES_MAX_REPORTS_PER_USER,
    )

    return savedEntity
  }

  async getAllSyncReportsByUser({
    userName,
  }: {
    userName: string
  }): Promise<SyncReportPostgresEntity[]> {
    return this.repository.find({
      where: {
        user_name: userName,
      },
      order: {
        created_at: "DESC",
      },
    })
  }

  async deleteByUserName(userName: string) {
    await this.repository.delete({ user_name: userName })
  }

  private async cleanupOldReports(
    userName: string,
    maxReportsPerUser: number,
  ): Promise<void> {
    // Find reports to delete (keep only the most recent maxReportsPerUser)
    const reportsToDelete = await this.repository.find({
      where: { user_name: userName },
      order: { created_at: "DESC" },
      skip: maxReportsPerUser,
    })

    if (reportsToDelete.length > 0) {
      const idsToDelete = reportsToDelete.map((report) => report.id)
      await this.repository.delete(idsToDelete)
    }
  }
}
