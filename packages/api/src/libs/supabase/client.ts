import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
)
