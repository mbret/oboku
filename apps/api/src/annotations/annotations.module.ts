import { Module } from "@nestjs/common"
import { CouchModule } from "../couch/couch.module.js"
import { AnnotationsCleanupService } from "./annotations-cleanup.service.js"

@Module({
  imports: [CouchModule],
  providers: [AnnotationsCleanupService],
})
export class AnnotationsModule {}
