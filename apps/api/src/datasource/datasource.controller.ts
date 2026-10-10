import {
  Body,
  Controller,
  Get,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { DataSourceService } from "./datasource.service.js"
import type { SyncDataSourceRequest } from "@oboku/shared"

@Controller("datasources")
export class DataSourcesController implements OnModuleInit {
  private logger = new Logger(DataSourcesController.name)
  private SYNC_QUEUE_NAME = "datasources.sync"

  constructor(
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly syncReportPostgresService: SyncReportPostgresService,
    private readonly datasourceService: DataSourceService,
    private readonly appConfig: AppConfigService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.SYNC_QUEUE_NAME,
      maxConcurrent: this.appConfig.QUEUE_DATASOURCES_SYNC_MAX_CONCURRENT,
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
    @Body() { dataSourceId, providerCredentials }: SyncDataSourceRequest,
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log(`syncDataSource ${dataSourceId}`)

    this.taskQueueService.enqueue(
      this.SYNC_QUEUE_NAME,
      () =>
        this.datasourceService.syncLongProgress({
          dataSourceId,
          providerCredentials,
          user,
        }),
      {
        id: dataSourceId,
      },
    )

    return {}
  }
}
