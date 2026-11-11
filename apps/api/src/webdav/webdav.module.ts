import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { WebDavService } from "./webdav.service.js"

@Module({
  imports: [InstanceConfigModule],
  providers: [WebDavService],
  exports: [WebDavService],
})
export class WebDavModule {}
