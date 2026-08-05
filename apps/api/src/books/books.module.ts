import { Module } from "@nestjs/common"
import { BooksController } from "./books.controller"
import { BooksMetadataService } from "./books-metadata.service"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { PluginsModule } from "src/plugins/plugins.module"
import { AdminModule } from "src/admin/admin.module"

@Module({
  imports: [CouchModule, CoversModule, PluginsModule, AdminModule],
  providers: [BooksMetadataService],
  controllers: [BooksController],
})
export class BooksModule {}
