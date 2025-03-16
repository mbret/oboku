import {
  Body,
  Controller,
  Headers,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { CollectionMetadataRefreshEvent, Events } from "../../events"
import { CollectionMetadataService } from "./CollectionMetadataService"
import { IsBoolean, IsString, IsOptional } from "class-validator"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"

class PostMetadataRefreshDto {
  @IsString()
  collectionId!: string

  @IsBoolean()
  @IsOptional()
  soft?: boolean
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
    @Body() body: PostMetadataRefreshDto,
    @Headers() headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) {
    this.logger.log(`metadataRefresh ${body.collectionId}`)

    this.taskQueueService.enqueue(
      this.QUEUE_NAME,
      () =>
        this.collectionMetadataService.refreshMetadata({
          collectionId: body.collectionId,
          credentials: JSON.parse(headers["oboku-credentials"] ?? "{}"),
          authorization: headers.authorization ?? "",
          soft: body.soft,
        }),
      {
        id: body.collectionId,
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
          credentials: event.data.obokuCredentials,
          authorization: event.data.authorization,
          soft: event.data.soft,
        }),
      {
        id: event.data.collectionId,
      },
    )
  }
}
