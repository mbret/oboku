import {
  Body,
  Controller,
  Get,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { InMemoryTaskQueueService } from "../features/queue/InMemoryTaskQueueService"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService"
import { AuthUser, WithAuthUser } from "src/auth/auth.guard"
import { DataSourceService } from "./datasource.service"

@Controller("datasources")
export class DataSourcesController implements OnModuleInit {
  private logger = new Logger(DataSourcesController.name)
  private SYNC_QUEUE_NAME = "datasources.sync"

  constructor(
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly syncReportPostgresService: SyncReportPostgresService,
    private readonly datasourceService: DataSourceService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.SYNC_QUEUE_NAME,
      maxConcurrent: 3,
      deduplicate: true,
      sequentialTasksWithSameId: true,
    })
  }

  @Get("sync-reports")
  async signin(@WithAuthUser() user: AuthUser) {
    return await this.syncReportPostgresService.getAllSyncReportsByUser({
      userName: user.email,
    })
  }

  @Post("sync")
  async syncDataSource(
    @Body() {
      dataSourceId,
      data,
    }: { dataSourceId: string; data?: Record<string, unknown> },
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log(`syncDataSource ${dataSourceId}`)

    this.taskQueueService.enqueue(
      this.SYNC_QUEUE_NAME,
      () =>
        this.datasourceService.syncLongProgress({
          dataSourceId,
          data: data ?? {},
          email: user.email,
        }),
      {
        id: dataSourceId,
      },
    )

    return {}
  }
}
