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
import type { EnvironmentVariables } from "../../types"
import { getParametersValue } from "../../lib/ssm"
import { getAuthTokenAsync } from "../../lib/auth"
import { createSupabaseClient } from "../../lib/supabase/client"
import { getNanoDbForUser } from "../../lib/couch/dbHelpers"
import { sync } from "../../lib/sync/sync"
import { configure } from "../../lib/plugins/google"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import { from } from "rxjs"

const syncLongProgress = async ({
  dataSourceId,
  credentials,
  authorization,
  config,
  eventEmitter,
}: {
  config: ConfigService<EnvironmentVariables>
  dataSourceId: string
  credentials: Record<string, string>
  authorization: string
  eventEmitter: EventEmitter2
}) => {
  const [client_id = ``, client_secret = ``, jwtPrivateKey = ``] =
    await getParametersValue({
      Names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "jwt-private-key"],
      WithDecryption: true,
    })

  // @todo only do once in a service
  configure({
    client_id,
    client_secret,
  })

  const { name } = await getAuthTokenAsync(
    {
      headers: {
        authorization,
      },
    },
    jwtPrivateKey,
  )

  await sync({
    userName: name,
    dataSourceId,
    db: await getNanoDbForUser(
      name,
      jwtPrivateKey,
      config.getOrThrow("COUCH_DB_URL", { infer: true }),
    ),
    credentials,
    authorization,
    config,
    eventEmitter,
  })
}

@Controller("datasources")
export class DataSourcesController implements OnModuleInit {
  private logger = new Logger(DataSourcesController.name)
  private SYNC_QUEUE_NAME = "datasources.sync"
  private supabaseClient: ReturnType<typeof createSupabaseClient>

  constructor(
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.supabaseClient = createSupabaseClient(this.configService)
  }

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.SYNC_QUEUE_NAME,
      maxConcurrent: 3,
      deduplicate: true,
      sequentialTasksWithSameId: true,
    })
  }

  @Get("reports")
  async signin(@Headers() { authorization }: { authorization: string }) {
    const [jwtPrivateKey = ``] = await getParametersValue({
      Names: ["jwt-private-key"],
      WithDecryption: true,
    })

    const { name } = await getAuthTokenAsync(
      {
        headers: {
          authorization,
        },
      },
      jwtPrivateKey,
    )

    const reportsResponse = await this.supabaseClient
      .from("sync_reports")
      .select("*")
      .eq("user_name", name)

    return reportsResponse.data ?? {}
  }

  @Post("sync")
  async syncDataSource(
    @Body() { dataSourceId }: { dataSourceId: string },
    @Headers() headers: { authorization: string; "oboku-credentials": string },
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
          }),
        ),
      {
        id: dataSourceId,
      },
    )

    return {}
  }
}
