import { Body, Controller, Logger, OnModuleInit, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { CollectionMetadataRefreshEvent, Events } from "../../events.js"
import { CollectionMetadataService } from "./CollectionMetadataService.js"
import { InMemoryTaskQueueService } from "../../queue/in-memory-task-queue.service.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import { WithAuthUser, type AuthUser } from "../../auth/auth.guard.js"
import { EmptyResponseDto } from "../../openapi/empty-response.dto.js"
import { RefreshCollectionMetadataDto } from "./collections.dto.js"

@Controller("collections")
export class CollectionsController implements OnModuleInit {
  private logger = new Logger(CollectionsController.name)
  private QUEUE_NAME = "collections.metadata.refresh"

  constructor(
    private collectionMetadataService: CollectionMetadataService,
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly appConfig: AppConfigService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.QUEUE_NAME,
      maxConcurrent:
        this.appConfig.QUEUE_COLLECTIONS_METADATA_REFRESH_MAX_CONCURRENT,
      deduplicate: true,
    })
  }

  @Post("metadata/refresh")
  async refreshMetadata(
    @Body()
    { collectionId, providerCredentials, soft }: RefreshCollectionMetadataDto,
    @WithAuthUser() user: AuthUser,
  ): Promise<EmptyResponseDto> {
    this.logger.log(`metadataRefresh ${collectionId}`)

    this.queueMetadataRefresh({
      collectionId,
      providerCredentials,
      soft,
      email: user.email,
    })

    return {}
  }

  @OnEvent(Events.COLLECTION_METADATA_REFRESH)
  async handleMetadataRefresh(event: CollectionMetadataRefreshEvent) {
    this.logger.log(`handleMetadataRefresh ${event.data.collectionId}`)

    return this.queueMetadataRefresh(event.data)
  }

  private queueMetadataRefresh(
    refresh: Parameters<CollectionMetadataService["refreshMetadata"]>[0],
  ) {
    const refreshMetadata = () =>
      this.collectionMetadataService.refreshMetadata(refresh)

    return this.taskQueueService.enqueue(this.QUEUE_NAME, refreshMetadata, {
      id: refresh.collectionId,
      sequentialKey: refresh.collectionId,
    })
  }
}
