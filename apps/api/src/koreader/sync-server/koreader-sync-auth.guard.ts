import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common"
import type { Request } from "express"
import {
  KOREADER_SYNC_KEY_HEADER,
  KOREADER_SYNC_USERNAME_HEADER,
} from "../protocol.js"
import { createKoreaderSyncError } from "./errors.js"
import { KoreaderSyncServerService } from "./koreader-sync-server.service.js"

type KoreaderSyncRequest = Request & { koreaderSyncUserId?: number }

/**
 * Authenticates a KOReader sync client by the `x-auth-user` and `x-auth-key`
 * headers every call carries, as koreader-sync-server does.
 */
@Injectable()
export class KoreaderSyncAuthGuard implements CanActivate {
  constructor(
    private readonly koreaderSyncServerService: KoreaderSyncServerService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<KoreaderSyncRequest>()
    const username = request.header(KOREADER_SYNC_USERNAME_HEADER)
    const key = request.header(KOREADER_SYNC_KEY_HEADER)

    const userId =
      username && key
        ? await this.koreaderSyncServerService.authorize({ username, key })
        : undefined

    if (userId === undefined) throw createKoreaderSyncError("unauthorized")

    request.koreaderSyncUserId = userId

    return true
  }
}

export const WithKoreaderSyncUserId = createParamDecorator(
  function getKoreaderSyncUserId(_, context: ExecutionContext) {
    const { koreaderSyncUserId } = context
      .switchToHttp()
      .getRequest<KoreaderSyncRequest>()

    if (koreaderSyncUserId === undefined) {
      throw createKoreaderSyncError("unauthorized")
    }

    return koreaderSyncUserId
  },
)
