import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"
import { refreshMetadataLongProcess } from "./metadata/refreshMetadataLongProcess"
import { lock } from "src/lib/supabase/lock"
import { createSupabaseClient } from "src/lib/supabase/client"

const LOCK_MAX_DURATION_MN = 5

@Injectable()
export class BooksMedataService {
  private logger = new Logger(BooksMedataService.name)

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  refreshMetadata = async (
    body: { bookId: string },
    headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) => {
    const supabase = createSupabaseClient(this.configService)

    Logger.log(`invoke for ${body.bookId}`)

    try {
      const lockId = `metadata_${body.bookId}`

      const { alreadyLocked } = await lock(
        lockId,
        LOCK_MAX_DURATION_MN,
        supabase,
      )

      if (!alreadyLocked) {
        refreshMetadataLongProcess(
          {
            authorization: headers.authorization ?? "",
            bookId: body.bookId,
            rawCredentials: headers["oboku-credentials"] ?? "{}",
          },
          this.configService,
          supabase,
        ).catch(this.logger.error.bind(this.logger))

        this.logger.log(`${body.bookId}: command sent with success`)
      } else {
        this.logger.log(`${body.bookId} is already locked, ignoring!`)
      }
    } catch (error) {
      this.logger.error(error)

      throw error
    }

    return {}
  }
}
