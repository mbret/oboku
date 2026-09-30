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
import { UnsafeRequestTargetError } from "src/lib/http/requestTarget"
import { createByteLimitTransform } from "src/plugins/plugins.service"
import {
  DownloadProxyDisabledError,
  DownloadService,
  LinkNotFoundError,
  LinkNotProxyableError,
} from "./download.service"

/**
 * RFC 6266 / RFC 5987: the ASCII `filename` stays as a fallback while
 * `filename*` carries the real name, so a provider name with non-ASCII
 * characters survives the trip to the browser.
 */
const buildContentDisposition = (fileName: string) => {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_")

  return `attachment; filename="${asciiFallback.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

@Controller("downloads")
export class DownloadController {
  private logger = new Logger(DownloadController.name)

  constructor(private readonly downloadService: DownloadService) {}

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
    const { stream, fileName, contentType, sizeBytes, maxSizeBytes } =
      await this.downloadService
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

    res.setHeader("Content-Type", contentType)

    if (fileName) {
      res.setHeader("Content-Disposition", buildContentDisposition(fileName))
    }

    /**
     * Only set when the provider reported a size: without it the app cannot
     * show download progress, and a wrong value would truncate the response.
     */
    if (sizeBytes !== undefined) {
      res.setHeader("Content-Length", sizeBytes)
    }

    pipeline(stream, createByteLimitTransform(maxSizeBytes), res, (error) => {
      if (!error) return

      this.logger.error(`Download of link ${linkId} failed`, error)

      /**
       * Headers are already flushed once bytes start flowing, so the only
       * signal left for a mid-stream failure is an abrupt close; the client
       * surfaces it as a failed download.
       */
      res.destroy(error)
    })
  }
}
