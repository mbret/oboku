import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { ApiBadGatewayResponse, ApiNotFoundResponse } from "@nestjs/swagger"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { ApiObokuErrors } from "../openapi/api-oboku-errors.decorator.js"
import { ObokuErrorResponseDto } from "../openapi/error-response.dto.js"
import {
  ListWebdavDirectoryDto,
  WebdavDirectoryResponseDto,
} from "./connectors.dto.js"
import { ConnectorsService } from "./connectors.service.js"

@Controller("connectors")
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  /**
   * The items of a directory on the server of a WebDAV connector, read by the
   * API, for a server that refuses requests from the browser.
   */
  @Post("webdav/directory")
  @HttpCode(HttpStatus.OK)
  @ApiObokuErrors()
  @ApiNotFoundResponse({ type: ObokuErrorResponseDto })
  @ApiBadGatewayResponse({ type: ObokuErrorResponseDto })
  async listWebdavDirectory(
    @Body() { connectorId, path, providerCredentials }: ListWebdavDirectoryDto,
    @WithAuthUser() user: AuthUser,
  ): Promise<WebdavDirectoryResponseDto> {
    return {
      items: await this.connectorsService.listWebdavDirectory({
        email: user.email,
        connectorId,
        path,
        password: providerCredentials.password,
      }),
    }
  }
}
