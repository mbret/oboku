import { Body, Controller, Logger, OnModuleInit, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { CollectionMetadataRefreshEvent, Events } from "../../events"
import { CollectionMetadataService } from "./CollectionMetadataService"
import { IsBoolean, IsString, IsOptional, IsObject } from "class-validator"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import { WithAuthUser, AuthUser } from "src/auth/auth.guard"
import { DataSourceType } from "@oboku/shared"
import { ProviderApiCredentials } from "@oboku/shared"

class PostMetadataRefreshDto {
  @IsString()
  collectionId!: string

  @IsBoolean()
  @IsOptional()
  soft?: boolean

  @IsObject()
  providerCredentials: ProviderApiCredentials<DataSourceType>
}

@Controller("collections")
export class CollectionsController implements OnModuleInit {
  private logger = new Logger(CollectionsController.name)
  private QUEUE_NAME = "collections.metadata.refresh"

  constructor(
    private collectionMetadataService: CollectionMetadataService,
    private readonly taskQueueService: InMemoryTaskQueueService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.QUEUE_NAME,
      maxConcurrent: 3,
      deduplicate: true,
      sequentialTasksWithSameId: true,
    })
  }

  @Post("metadata/refresh")
  async metadataRefresh(
    @Body() { collectionId, providerCredentials, soft }: PostMetadataRefreshDto,
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log(`metadataRefresh ${collectionId}`)

    this.taskQueueService.enqueue(
      this.QUEUE_NAME,
      () =>
        this.collectionMetadataService.refreshMetadata({
          collectionId: collectionId,
          providerCredentials: providerCredentials,
          soft,
          email: user.email,
        }),
      {
        id: collectionId,
      },
    )

    return {}
  }

  @OnEvent(Events.COLLECTION_METADATA_REFRESH)
  async handleMetadataRefresh(event: CollectionMetadataRefreshEvent) {
    this.logger.log(`handleMetadataRefresh ${event.data.collectionId}`)

    return this.taskQueueService.enqueue(
      this.QUEUE_NAME,
      () =>
        this.collectionMetadataService.refreshMetadata({
          collectionId: event.data.collectionId,
          providerCredentials: event.data.providerCredentials,
          soft: event.data.soft,
          email: event.data.email,
        }),
      {
        id: event.data.collectionId,
      },
    )
  }
}
