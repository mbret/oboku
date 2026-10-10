import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common"
import { Public } from "../auth/auth.guard.js"
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
@Controller("kosync")
export class KoreaderSyncProtocolController {
  constructor(
    private readonly koreaderSyncServerService: KoreaderSyncServerService,
  ) {}

  @Post("users/create")
  register(): never {
    throw createKoreaderSyncError("registrationDisabled")
  }

  @Get("users/auth")
  @UseGuards(KoreaderSyncAuthGuard)
  authorize() {
    return { authorized: "OK" }
  }

  @Put("syncs/progress")
  @UseGuards(KoreaderSyncAuthGuard)
  async updateProgress(
    @WithKoreaderSyncUserId() userId: number,
    @Body() body: unknown,
  ) {
    const { document, progress, percentage, device, deviceId } =
      parseProgressUpdate(body)
    const updatedAt = new Date()

    const isSaved = await this.koreaderSyncServerService.saveProgress({
      user_id: userId,
      document,
      progress,
      percentage,
      device,
      device_id: deviceId,
      updated_at: updatedAt,
    })

    if (!isSaved) throw createKoreaderSyncError("unauthorized")

    return { document, timestamp: toSyncTimestamp(updatedAt) }
  }

  @Get("syncs/progress/:document")
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

  @Get("healthcheck")
  healthcheck() {
    return { state: "OK" }
  }
}
