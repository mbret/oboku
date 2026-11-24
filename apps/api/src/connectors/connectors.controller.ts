import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { ApiBadGatewayResponse, ApiNotFoundResponse } from "@nestjs/swagger"
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
   * The items of a folder on a WebDAV server, read by the API, for a server
   * that refuses requests from the browser. The app lists folders and tests a
   * connection with it.
   */
  @Post("webdav/directory")
  @HttpCode(HttpStatus.OK)
  @ApiObokuErrors()
  @ApiNotFoundResponse({ type: ObokuErrorResponseDto })
  @ApiBadGatewayResponse({ type: ObokuErrorResponseDto })
  async listWebdavDirectory(
    @Body() body: ListWebdavDirectoryDto,
  ): Promise<WebdavDirectoryResponseDto> {
    return { items: await this.connectorsService.listWebdavDirectory(body) }
  }
}
