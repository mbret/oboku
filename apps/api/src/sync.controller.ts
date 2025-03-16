import { Controller, Get, Headers } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"
import { getParametersValue } from "./lib/ssm"
import { getAuthTokenAsync } from "./lib/auth"
import { createSupabaseClient } from "./lib/supabase/client"

@Controller("sync")
export class SyncController {
  protected supabaseClient: ReturnType<typeof createSupabaseClient>

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
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
}
