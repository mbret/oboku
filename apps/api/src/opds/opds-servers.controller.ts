import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { OkResponseDto } from "../openapi/ok-response.dto.js"
import {
  OpdsServerDto,
  OpdsServerPasswordResponseDto,
  RenameOpdsServerDto,
} from "./opds-servers.dto.js"
import { OpdsServersService } from "./opds-servers.service.js"

const toOpdsServerDto = ({
  server,
  user,
}: {
  server: OpdsServerPostgresEntity
  user: AuthUser
}): OpdsServerDto => ({
  id: server.id,
  slug: server.slug,
  name: server.name,
  username: user.email,
  createdAt: server.created_at.toISOString(),
})

/** The signed-in user's OPDS servers, managed from the app. */
@Controller("opds-servers")
export class OpdsServersController {
  constructor(private readonly opdsServersService: OpdsServersService) {}

  @Get()
  async list(@WithAuthUser() user: AuthUser): Promise<OpdsServerDto[]> {
    const servers = await this.opdsServersService.list(user.userId)

    return servers.map((server) => toOpdsServerDto({ server, user }))
  }

  @Post()
  async create(
    @WithAuthUser() user: AuthUser,
  ): Promise<OpdsServerPasswordResponseDto> {
    const { server, password } = await this.opdsServersService.create(
      user.userId,
    )

    return { server: toOpdsServerDto({ server, user }), password }
  }

  @Patch(":id")
  async rename(
    @WithAuthUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: RenameOpdsServerDto,
  ): Promise<OpdsServerDto> {
    const server = await this.opdsServersService.rename({
      userId: user.userId,
      id,
      name: body.name,
    })

    return toOpdsServerDto({ server, user })
  }

  @Post(":id/password")
  async regeneratePassword(
    @WithAuthUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<OpdsServerPasswordResponseDto> {
    const { server, password } =
      await this.opdsServersService.regeneratePassword({
        userId: user.userId,
        id,
      })

    return { server: toOpdsServerDto({ server, user }), password }
  }

  @Delete(":id")
  async delete(
    @WithAuthUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<OkResponseDto> {
    await this.opdsServersService.delete({ userId: user.userId, id })

    return { ok: true }
  }
}
