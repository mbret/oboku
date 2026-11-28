import {
  Body,
  Controller,
  Get,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { from } from "rxjs"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { LibrarySyncService } from "./library-sync.service.js"
import { EmptyResponseDto } from "../openapi/empty-response.dto.js"
import { SyncReportDto } from "./sync/sync-report.dto.js"
import { RunLibrarySyncDto } from "./library-sync.dto.js"

@Controller("datasources")
export class LibrarySyncsController implements OnModuleInit {
  private logger = new Logger(LibrarySyncsController.name)
  private SYNC_QUEUE_NAME = "datasources.sync"

  constructor(
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly syncReportPostgresService: SyncReportPostgresService,
    private readonly librarySyncService: LibrarySyncService,
    private readonly appConfig: AppConfigService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.SYNC_QUEUE_NAME,
      maxConcurrent: this.appConfig.QUEUE_DATASOURCES_SYNC_MAX_CONCURRENT,
      deduplicate: true,
    })
  }

  @Get("sync-reports")
  async listSyncReports(
    @WithAuthUser() user: AuthUser,
  ): Promise<SyncReportDto[]> {
    return await this.syncReportPostgresService.getAllSyncReportsByUser({
      userName: user.email,
    })
  }

  @Post("sync")
  async sync(
    @Body() { dataSourceId, providerCredentials }: RunLibrarySyncDto,
    @WithAuthUser() user: AuthUser,
  ): Promise<EmptyResponseDto> {
    this.logger.log(`Library sync ${dataSourceId}`)

    this.taskQueueService.enqueue(
      this.SYNC_QUEUE_NAME,
      () =>
        from(
          this.librarySyncService.sync({
            dataSourceId,
            providerCredentials,
            user,
          }),
        ),
      {
        id: dataSourceId,
        sequentialKey: user.email,
      },
    )

    return {}
  }
}
