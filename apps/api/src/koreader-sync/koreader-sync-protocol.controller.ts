import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common"
import { Public } from "../auth/auth.guard"
import { createKoreaderSyncError } from "./errors"
import {
  KoreaderSyncAuthGuard,
  WithKoreaderSyncUserId,
} from "./koreader-sync-auth.guard"
import { KoreaderSyncService } from "./koreader-sync.service"
import {
  parseProgressUpdate,
  toProgressResponse,
  toSyncTimestamp,
} from "./progress"

/**
 * The KOReader sync protocol as koreader-sync-server serves it, so KOReader,
 * Readest, Crosspoint and the other clients can use oboku as their server.
 * Clients sign in with the account email and a password generated in the app,
 * never with a session: the app's own auth does not apply here.
 */
@Public()
@Controller("kosync")
export class KoreaderSyncProtocolController {
  constructor(private readonly koreaderSyncService: KoreaderSyncService) {}

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

    await this.koreaderSyncService.saveProgress({
      user_id: userId,
      document,
      progress,
      percentage,
      device,
      device_id: deviceId,
      updated_at: updatedAt,
    })

    return { document, timestamp: toSyncTimestamp(updatedAt) }
  }

  @Get("syncs/progress/:document")
  @UseGuards(KoreaderSyncAuthGuard)
  async getProgress(
    @WithKoreaderSyncUserId() userId: number,
    @Param("document") document: string,
  ) {
    const progress = await this.koreaderSyncService.findProgress({
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
