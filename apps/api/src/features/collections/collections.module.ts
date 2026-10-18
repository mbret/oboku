import { Module } from "@nestjs/common"
import { CouchModule } from "../../couch/couch.module.js"
import { CoversModule } from "../../covers/covers.module.js"
import { PluginsModule } from "../../plugins/plugins.module.js"
import { CollectionMetadataService } from "./CollectionMetadataService.js"
import { CollectionsController } from "./collections.controller.js"

@Module({
  imports: [CouchModule, CoversModule, PluginsModule],
  providers: [CollectionMetadataService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
