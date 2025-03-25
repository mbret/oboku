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
import { sync } from "../../lib/sync/sync"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import { from } from "rxjs"
import { SyncReportPostgresService } from "../postgres/SyncReportPostgresService"
import { CouchService } from "src/couch/couch.service"
import { AuthUser, AutUser } from "src/auth/auth.guard"

const syncLongProgress = async ({
  dataSourceId,
  credentials,
  authorization,
  config,
  eventEmitter,
  syncReportPostgresService,
  couchService,
  email,
}: {
  config: ConfigService<EnvironmentVariables>
  dataSourceId: string
  credentials: Record<string, string>
  authorization: string
  eventEmitter: EventEmitter2
  syncReportPostgresService: SyncReportPostgresService
  couchService: CouchService
  email: string
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
  async signin(@AutUser() user: AuthUser) {
    return await this.syncReportPostgresService.getAllSyncReportsByUser({
      userName: user.email,
    })
  }

  @Post("sync")
  async syncDataSource(
    @Body() { dataSourceId }: { dataSourceId: string },
    @Headers() headers: { authorization: string; "oboku-credentials": string },
    @AutUser() user: AuthUser,
  ) {
    this.logger.log(`syncDataSource ${dataSourceId}`)

    this.taskQueueService.enqueue(
      this.SYNC_QUEUE_NAME,
      () =>
        from(
          syncLongProgress({
            dataSourceId,
            credentials: JSON.parse(headers["oboku-credentials"] ?? "{}"),
            authorization: headers.authorization,
            config: this.configService,
            eventEmitter: this.eventEmitter,
            syncReportPostgresService: this.syncReportPostgresService,
            couchService: this.couchService,
            email: user.email,
          }),
        ),
      {
        id: dataSourceId,
      },
    )

    return {}
  }
}
