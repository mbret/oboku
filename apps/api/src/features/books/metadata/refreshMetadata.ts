import { Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createSupabaseClient } from "src/lib/supabase/client"
import { lock } from "src/lib/supabase/lock"
import { EnvironmentVariables } from "src/types"
import { refreshMetadataLongProcess } from "./refreshMetadataLongProcess"

const LOCK_MAX_DURATION_MN = 5

export const refreshMetadata = async (
  body: { bookId: string },
  headers: {
    "oboku-credentials"?: string
    authorization?: string
  },
  configService: ConfigService<EnvironmentVariables>,
) => {
  const supabase = createSupabaseClient(configService)

  Logger.log(`invoke for ${body.bookId}`)

  try {
    const lockId = `metadata_${body.bookId}`

    const { alreadyLocked } = await lock(lockId, LOCK_MAX_DURATION_MN, supabase)

    if (!alreadyLocked) {
      refreshMetadataLongProcess(
        {
          authorization: headers.authorization ?? "",
          bookId: body.bookId,
          rawCredentials: headers["oboku-credentials"] ?? "{}",
        },
        configService,
        supabase,
      ).catch(Logger.error.bind(Logger))

      Logger.log(`${body.bookId}: command sent with success`)
    } else {
      Logger.log(`${body.bookId} is already locked, ignoring!`)
    }
  } catch (error) {
    Logger.error(error)

    throw error
  }

  return {}
}
