import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  NotFoundException,
  Post,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common"
import type { DownloadLinkRequest } from "@oboku/shared"
import type { Response } from "express"
import { pipeline } from "node:stream"
import { AuthUser, WithAuthUser } from "src/auth/auth.guard"
import { AppConfigService } from "src/config/AppConfigService"
import { UnsafeRequestTargetError } from "src/lib/http/requestTarget"
import { createByteLimitTransform } from "src/plugins/plugins.service"
import {
  DownloadProxyDisabledError,
  DownloadService,
  LinkNotFoundError,
  LinkNotProxyableError,
} from "./download.service"

@Controller("downloads")
export class DownloadController {
  private logger = new Logger(DownloadController.name)

  constructor(
    private readonly downloadService: DownloadService,
    private readonly appConfigService: AppConfigService,
  ) {}

  /**
   * Streams a link's file through the instance instead of letting the browser
   * fetch the provider directly, for providers that serve no CORS headers.
   *
   * POST rather than GET because provider credentials are end-to-end encrypted
   * with a key only the client holds, so they have to travel in the request
   * body on every download.
   */
  @Post()
  async downloadLink(
    @Body() { linkId, providerCredentials }: DownloadLinkRequest,
    @WithAuthUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const { stream } = await this.downloadService
      .streamLink({ linkId, providerCredentials, email: user.email })
      .catch((error) => {
        if (error instanceof DownloadProxyDisabledError) {
          throw new ServiceUnavailableException(error.message)
        }

        if (error instanceof LinkNotFoundError) {
          throw new NotFoundException(error.message)
        }

        if (
          error instanceof LinkNotProxyableError ||
          error instanceof UnsafeRequestTargetError
        ) {
          throw new BadRequestException(error.message)
        }

        throw error
      })

    res.setHeader("Content-Type", "application/octet-stream")

    pipeline(
      stream,
      createByteLimitTransform(
        this.appConfigService.DOWNLOAD_PROXY_MAX_SIZE_BYTES,
      ),
      res,
      (error) => {
        if (!error) return

        this.logger.error(`Download of link ${linkId} failed`, error)

        /**
         * Headers are already flushed once bytes start flowing, so the only
         * signal left for a mid-stream failure is an abrupt close; the client
         * surfaces it as a failed download.
         */
        res.destroy(error)
      },
    )
  }
}
