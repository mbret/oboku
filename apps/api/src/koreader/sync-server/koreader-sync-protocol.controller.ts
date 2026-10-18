import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import { Public } from "../../auth/auth.guard.js"
import {
  KOREADER_SYNC_AUTHORIZE_ROUTE,
  KOREADER_SYNC_HEALTHCHECK_ROUTE,
  KOREADER_SYNC_KEY_HEADER,
  KOREADER_SYNC_PROGRESS_ROUTE,
  KOREADER_SYNC_REGISTER_ROUTE,
} from "../protocol.js"
import { createKoreaderSyncError } from "./errors.js"
import {
  KoreaderSyncAuthGuard,
  WithKoreaderSyncUserId,
} from "./koreader-sync-auth.guard.js"
import { KoreaderSyncServerService } from "./koreader-sync-server.service.js"
import {
  parseProgressUpdate,
  toProgressResponse,
  toSyncTimestamp,
} from "./progress.js"

/**
 * The KOReader sync protocol as koreader-sync-server serves it, so KOReader,
 * Readest, CrossPoint and the other clients can use oboku as their server.
 * Clients sign in with the account email and a password generated in the app,
 * never with a session: the app's own auth does not apply here.
 */
@Public()
@ApiExcludeController()
@Controller("kosync")
export class KoreaderSyncProtocolController {
  constructor(
    private readonly koreaderSyncServerService: KoreaderSyncServerService,
  ) {}

  @Post(KOREADER_SYNC_REGISTER_ROUTE)
  register(): never {
    throw createKoreaderSyncError("registrationDisabled")
  }

  @Get(KOREADER_SYNC_AUTHORIZE_ROUTE)
  @UseGuards(KoreaderSyncAuthGuard)
  authorize() {
    return { authorized: "OK" }
  }

  @Put(KOREADER_SYNC_PROGRESS_ROUTE)
  @UseGuards(KoreaderSyncAuthGuard)
  async updateProgress(
    @WithKoreaderSyncUserId() userId: number,
    @Headers(KOREADER_SYNC_KEY_HEADER) key: string,
    @Body() body: unknown,
  ) {
    const { document, progress, percentage, device, deviceId } =
      parseProgressUpdate(body)
    const updatedAt = new Date()

    const isSaved = await this.koreaderSyncServerService.saveProgress({
      progress: {
        user_id: userId,
        document,
        progress,
        percentage,
        device,
        device_id: deviceId,
        updated_at: updatedAt,
      },
      key,
    })

    if (!isSaved) throw createKoreaderSyncError("unauthorized")

    return { document, timestamp: toSyncTimestamp(updatedAt) }
  }

  @Get(`${KOREADER_SYNC_PROGRESS_ROUTE}/:document`)
  @UseGuards(KoreaderSyncAuthGuard)
  async getProgress(
    @WithKoreaderSyncUserId() userId: number,
    @Param("document") document: string,
  ) {
    const progress = await this.koreaderSyncServerService.findProgress({
      userId,
      document,
    })

    return progress ? toProgressResponse(progress) : {}
  }

  @Get(KOREADER_SYNC_HEALTHCHECK_ROUTE)
  healthcheck() {
    return { state: "OK" }
  }
}
