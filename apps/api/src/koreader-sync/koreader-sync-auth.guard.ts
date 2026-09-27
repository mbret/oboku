import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common"
import type { Request } from "express"
import { createKoreaderSyncError } from "./errors"
import { KoreaderSyncService } from "./koreader-sync.service"

type KoreaderSyncRequest = Request & { koreaderSyncUserId?: number }

/**
 * Authenticates a KOReader sync client by the `x-auth-user` and `x-auth-key`
 * headers every call carries, as koreader-sync-server does.
 */
@Injectable()
export class KoreaderSyncAuthGuard implements CanActivate {
  constructor(private readonly koreaderSyncService: KoreaderSyncService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<KoreaderSyncRequest>()
    const username = request.header("x-auth-user")
    const key = request.header("x-auth-key")

    const userId =
      username && key
        ? await this.koreaderSyncService.authorize({ username, key })
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
