import { Body, Controller, Get, Headers, Logger, Post } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { EnvironmentVariables } from "../../types"
import { getParametersValue } from "../../lib/ssm"
import { getAuthTokenAsync } from "../../lib/auth"
import { createSupabaseClient } from "../../lib/supabase/client"
import { lock } from "../../lib/supabase/lock"
import { deleteLock } from "../../lib/supabase/deleteLock"
import { getNanoDbForUser } from "../../lib/couch/dbHelpers"
import { sync } from "../../lib/sync/sync"
import { configure } from "../../lib/plugins/google"
import { EventEmitter2 } from "@nestjs/event-emitter"

const syncLongProgress = async ({
  dataSourceId,
  credentials,
  authorization,
  supabase,
  config,
  eventEmitter,
}: {
  config: ConfigService<EnvironmentVariables>
  supabase: ReturnType<typeof createSupabaseClient>
  dataSourceId: string
  credentials: Record<string, string>
  authorization: string
  eventEmitter: EventEmitter2
}) => {
  const lockId = `sync_${dataSourceId}`

  try {
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

    await deleteLock(supabase, lockId)
  } catch (e) {
    await deleteLock(supabase, lockId)

    throw e
  }
}

@Controller("datasources")
export class DataSourcesController {
  protected supabaseClient: ReturnType<typeof createSupabaseClient>

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.supabaseClient = createSupabaseClient(this.configService)
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
    const localLogger = new Logger(
      `${DataSourcesController.name}.syncDataSource`,
    )

    const LOCK_MAX_DURATION_MN = 10

    localLogger.log(`invoke for ${dataSourceId}`)

    try {
      const lockId = `sync_${dataSourceId}`

      const { alreadyLocked } = await lock(
        lockId,
        LOCK_MAX_DURATION_MN,
        this.supabaseClient,
      )

      if (!alreadyLocked) {
        syncLongProgress({
          dataSourceId,
          credentials: JSON.parse(headers["oboku-credentials"] ?? "{}"),
          authorization: headers.authorization,
          supabase: this.supabaseClient,
          config: this.configService,
          eventEmitter: this.eventEmitter,
        }).catch(Logger.error.bind(Logger))

        localLogger.log(`${dataSourceId}: command sent with success `)
      } else {
        localLogger.log(`${dataSourceId} is already locked, ignoring!`)
      }
    } catch (error) {
      localLogger.error(error)

      throw error
    }

    return {}
  }
}
