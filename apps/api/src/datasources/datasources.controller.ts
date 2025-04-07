import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { EnvironmentVariables } from "../config/types"
import { sync } from "../lib/sync/sync"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { InMemoryTaskQueueService } from "../features/queue/InMemoryTaskQueueService"
import { from } from "rxjs"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService"
import { CouchService } from "src/couch/couch.service"
import { AuthUser, WithAuthUser } from "src/auth/auth.guard"
import { CoversService } from "src/covers/covers.service"

const syncLongProgress = async ({
  dataSourceId,
  credentials,
  authorization,
  config,
  eventEmitter,
  syncReportPostgresService,
  couchService,
  email,
  coversService,
}: {
  config: ConfigService<EnvironmentVariables>
  dataSourceId: string
  credentials: Record<string, unknown>
  authorization: string
  eventEmitter: EventEmitter2
  syncReportPostgresService: SyncReportPostgresService
  couchService: CouchService
  email: string
  coversService: CoversService
}) => {
  await sync({
    userName: email,
    dataSourceId,
    db: await couchService.createNanoInstanceForUser({ email }),
    credentials,
    authorization,
    config,
    eventEmitter,
    syncReportPostgresService,
    email,
    coversService,
  })
}

@Controller("datasources")
export class DataSourcesController implements OnModuleInit {
  private logger = new Logger(DataSourcesController.name)
  private SYNC_QUEUE_NAME = "datasources.sync"

  constructor(
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
    private readonly syncReportPostgresService: SyncReportPostgresService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
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
    @Headers() headers: { authorization: string },
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log(`syncDataSource ${dataSourceId}`)

    this.taskQueueService.enqueue(
      this.SYNC_QUEUE_NAME,
      () =>
        from(
          syncLongProgress({
            dataSourceId,
            credentials: data ?? {},
            authorization: headers.authorization,
            config: this.configService,
            eventEmitter: this.eventEmitter,
            syncReportPostgresService: this.syncReportPostgresService,
            couchService: this.couchService,
            email: user.email,
            coversService: this.coversService,
          }),
        ),
      {
        id: dataSourceId,
      },
    )

    return {}
  }
}
