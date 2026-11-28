import { Body, Controller, Logger, OnModuleInit, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "../events.js"
import { BooksMetadataService } from "./books-metadata.service.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { from } from "rxjs"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { EmptyResponseDto } from "../openapi/empty-response.dto.js"
import { RefreshBookMetadataDto } from "./books.dto.js"

@Controller("books")
export class BooksController implements OnModuleInit {
  private logger = new Logger(BooksController.name)
  private BOOKS_METADATA_REFRESH_QUEUE = "books.metadata.refresh"

  constructor(
    private booksMetadataService: BooksMetadataService,
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly appConfig: AppConfigService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.BOOKS_METADATA_REFRESH_QUEUE,
      maxConcurrent: this.appConfig.QUEUE_BOOKS_METADATA_REFRESH_MAX_CONCURRENT,
      deduplicate: true,
    })
  }

  @Post("metadata/refresh")
  async refreshMetadata(
    @Body() { bookId, providerCredentials, force }: RefreshBookMetadataDto,
    @WithAuthUser() user: AuthUser,
  ): Promise<EmptyResponseDto> {
    this.logger.log("metadataRefresh", bookId, { force })

    this.queueMetadataRefresh({
      bookId,
      force,
      providerCredentials,
      email: user.email,
    })

    return {}
  }

  @OnEvent(Events.BOOKS_METADATA_REFRESH)
  async handleBooksMetadataRefresh(event: BooksMetadataRefreshEvent) {
    this.logger.log("handleBooksMetadataRefresh", event.data.bookId)

    this.queueMetadataRefresh(event.data)
  }

  private queueMetadataRefresh({
    bookId,
    force,
    providerCredentials,
    email,
  }: Pick<
    RefreshBookMetadataDto,
    "bookId" | "force" | "providerCredentials"
  > & {
    email: string
  }) {
    const refreshMetadata = () =>
      from(
        this.booksMetadataService.refreshMetadata(
          { bookId, force },
          providerCredentials,
          email,
        ),
      )

    return this.taskQueueService.enqueue(
      this.BOOKS_METADATA_REFRESH_QUEUE,
      refreshMetadata,
      { id: bookId, sequentialKey: bookId },
    )
  }
}
