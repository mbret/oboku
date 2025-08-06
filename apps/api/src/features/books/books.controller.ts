import { Body, Controller, Logger, OnModuleInit, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "../../events"
import { BooksMetadataService } from "./BooksMetadataService"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import { from } from "rxjs"
import { AuthUser } from "src/auth/auth.guard"
import { WithAuthUser } from "src/auth/auth.guard"

@Controller("books")
export class BooksController implements OnModuleInit {
  private logger = new Logger(BooksController.name)
  private BOOKS_METADATA_REFRESH_QUEUE = "books.metadata.refresh"

  constructor(
    private booksMetadataService: BooksMetadataService,
    private readonly taskQueueService: InMemoryTaskQueueService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.BOOKS_METADATA_REFRESH_QUEUE,
      maxConcurrent: 3,
      deduplicate: true,
      sequentialTasksWithSameId: true,
    })
  }

  @Post("metadata/refresh")
  async metadataRefresh(
    @Body() {
      bookId,
      data,
    }: { bookId: string; data?: Record<string, unknown> },
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log("metadataRefresh", bookId)

    this.taskQueueService.enqueue(
      this.BOOKS_METADATA_REFRESH_QUEUE,
      () =>
        from(
          this.booksMetadataService.refreshMetadata(
            { bookId },
            data ?? {},
            user.email,
          ),
        ),
      {
        id: bookId,
      },
    )

    return {}
  }

  @OnEvent(Events.BOOKS_METADATA_REFRESH)
  async handleBooksMetadataRefresh(event: BooksMetadataRefreshEvent) {
    this.logger.log("handleBooksMetadataRefresh", event.data.bookId)

    this.taskQueueService.enqueue(
      this.BOOKS_METADATA_REFRESH_QUEUE,
      () =>
        from(
          this.booksMetadataService.refreshMetadata(
            {
              bookId: event.data.bookId,
            },
            event.data.data ?? {},
            event.data.email,
          ),
        ),
      {
        id: event.data.bookId,
      },
    )
  }
}
