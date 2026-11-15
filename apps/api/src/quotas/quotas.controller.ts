import { Controller, Get } from "@nestjs/common"
import { ProxiedDownloadQuotaService } from "./proxied-download-quota.service.js"
import type { ProxiedDownloadQuotaResponseDto } from "./quotas.dto.js"

@Controller("quotas")
export class QuotasController {
  constructor(
    private readonly proxiedDownloadQuotaService: ProxiedDownloadQuotaService,
  ) {}

  @Get("proxied-downloads")
  getProxiedDownloadQuota(): Promise<ProxiedDownloadQuotaResponseDto> {
    return this.proxiedDownloadQuotaService.getUsage()
  }
}
