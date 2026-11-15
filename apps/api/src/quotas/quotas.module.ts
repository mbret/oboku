import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { ProxiedDownloadQuotaService } from "./proxied-download-quota.service.js"
import { QuotasController } from "./quotas.controller.js"

@Module({
  imports: [PostgresModule, InstanceConfigModule],
  controllers: [QuotasController],
  providers: [ProxiedDownloadQuotaService],
  exports: [ProxiedDownloadQuotaService],
})
export class QuotasModule {}
