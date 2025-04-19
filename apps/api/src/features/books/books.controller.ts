import {
  Body,
  Controller,
  Headers,
  Logger,
  OnModuleInit,
  Post,
} from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "../../events"
import { BooksMedataService } from "./BooksMedataService"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import { from } from "rxjs"
import { AuthUser } from "src/auth/auth.guard"
import { WithAuthUser } from "src/auth/auth.guard"

@Controller("books")
export class BooksController implements OnModuleInit {
  private logger = new Logger(BooksController.name)
  private QUEUE_NAME = "books.metadata.refresh"

  constructor(
    private booksMedataService: BooksMedataService,
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
    @Body() {
      bookId,
      data,
    }: { bookId: string; data?: Record<string, unknown> },
    @WithAuthUser() user: AuthUser,
  ) {
    this.logger.log("metadataRefresh", bookId)

    this.taskQueueService.enqueue(
      this.QUEUE_NAME,
      () =>
        from(
          this.booksMedataService.refreshMetadata(
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
      this.QUEUE_NAME,
      () =>
        from(
          this.booksMedataService.refreshMetadata(
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
