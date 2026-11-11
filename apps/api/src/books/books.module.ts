import { Module } from "@nestjs/common"
import { BooksController } from "./books.controller.js"
import { BooksMetadataService } from "./books-metadata.service.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { PluginsModule } from "../plugins/plugins.module.js"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"

@Module({
  imports: [CouchModule, CoversModule, PluginsModule, InstanceConfigModule],
  providers: [BooksMetadataService],
  controllers: [BooksController],
})
export class BooksModule {}
