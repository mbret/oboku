import { Controller, Get } from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { ProxiedDownloadQuotaService } from "./proxied-download-quota.service.js"
import type { UserProxiedDownloadQuotaResponseDto } from "./quotas.dto.js"

@Controller("quotas")
export class QuotasController {
  constructor(
    private readonly proxiedDownloadQuotaService: ProxiedDownloadQuotaService,
  ) {}

  @Get("proxied-downloads")
  getProxiedDownloadQuota(
    @WithAuthUser() user: AuthUser,
  ): Promise<UserProxiedDownloadQuotaResponseDto> {
    return this.proxiedDownloadQuotaService.getUserUsage(user.userId)
  }
}
