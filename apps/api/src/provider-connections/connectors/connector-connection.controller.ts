import { Body, Controller, Delete, Get, Param, Put } from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../../auth/auth.guard.js"
import { ApiObokuErrors } from "../../openapi/api-oboku-errors.decorator.js"
import { OkResponseDto } from "../../openapi/ok-response.dto.js"
import {
  ConnectConnectorDto,
  ConnectorConnectionResponseDto,
  ConnectorConnectionsResponseDto,
} from "./connector-connection.dto.js"
import { ConnectorConnectionService } from "./connector-connection.service.js"

/** The connectors whose password the signed-in user lets the API keep. */
@Controller("provider-connections/connectors")
export class ConnectorConnectionController {
  constructor(
    private readonly connectorConnectionService: ConnectorConnectionService,
  ) {}

  @Get()
  async list(
    @WithAuthUser() user: AuthUser,
  ): Promise<ConnectorConnectionsResponseDto> {
    return {
      connections: await this.connectorConnectionService.list({
        userId: user.userId,
        email: user.email,
      }),
    }
  }

  @ApiObokuErrors()
  @Put(":connectorId")
  async connect(
    @WithAuthUser() user: AuthUser,
    @Param("connectorId") connectorId: string,
    @Body() body: ConnectConnectorDto,
  ): Promise<ConnectorConnectionResponseDto> {
    return {
      connection: await this.connectorConnectionService.connect({
        userId: user.userId,
        email: user.email,
        connectorId,
        password: body.password,
        decryptedFrom: body.decryptedFrom,
      }),
    }
  }

  @Delete(":connectorId")
  async disconnect(
    @WithAuthUser() user: AuthUser,
    @Param("connectorId") connectorId: string,
  ): Promise<OkResponseDto> {
    await this.connectorConnectionService.disconnect({
      userId: user.userId,
      connectorId,
    })

    return { ok: true }
  }
}
