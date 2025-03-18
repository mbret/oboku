import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ReportEntry } from "@oboku/shared"
import { AppConfigService } from "../config/AppConfigService"
import { SyncReportPostgresEntity } from "./entities"

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
    report: ReportEntry[]
    datasource_id: string
    user_name: string
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
