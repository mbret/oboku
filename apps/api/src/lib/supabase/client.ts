import { ConfigService } from "@nestjs/config"
import { createClient } from "@supabase/supabase-js"
import { EnvironmentVariables } from "src/types"

export const createSupabaseClient = (
  config: ConfigService<EnvironmentVariables>,
) =>
  createClient(
    config.getOrThrow("SUPABASE_PROJECT_URL", { infer: true }),
    config.getOrThrow("SUPABASE_SERVICE_ROLE_KEY", { infer: true }),
  )
