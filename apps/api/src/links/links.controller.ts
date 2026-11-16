import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common"
import {
  ApiOkResponse,
  ApiProduces,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger"
import type { Request, Response } from "express"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { ObokuErrorResponseDto } from "../openapi/error-response.dto.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import { DownloadLinkDto } from "./links.dto.js"
import { LinksService } from "./links.service.js"

@Controller("links")
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly proxiedDownloadQuotaService: ProxiedDownloadQuotaService,
  ) {}

  /**
   * The file of a WebDAV link, read from its server by the API, for a server
   * that refuses requests from the browser. It counts towards the monthly
   * proxied download quotas, and answers 429 until the next month once it
   * would pass one.
   */
  @Post("download")
  @HttpCode(HttpStatus.OK)
  @ApiProduces("application/octet-stream")
  @ApiOkResponse({ schema: { type: "string", format: "binary" } })
  @ApiTooManyRequestsResponse({ type: ObokuErrorResponseDto })
  async download(
    @Body() { linkId, providerCredentials }: DownloadLinkDto,
    @WithAuthUser() user: AuthUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.linksService.streamLinkFile({
      email: user.email,
      linkId,
      providerCredentials,
    })

    return this.proxiedDownloadQuotaService.deliver({
      userId: user.userId,
      file,
      request,
      response,
    })
  }
}
