import { Module } from "@nestjs/common"
import { AdminModule } from "src/admin/admin.module"
import { WebDavService } from "./webdav.service"

@Module({
  imports: [AdminModule],
  providers: [WebDavService],
  exports: [WebDavService],
})
export class WebDavModule {}
