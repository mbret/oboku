import { Module } from "@nestjs/common"
import { AdminModule } from "../admin/admin.module.js"
import { WebDavService } from "./webdav.service.js"

@Module({
  imports: [AdminModule],
  providers: [WebDavService],
  exports: [WebDavService],
})
export class WebDavModule {}
