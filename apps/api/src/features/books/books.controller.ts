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
    @Body() body: { bookId: string },
    @WithAuthUser() user: AuthUser,
    @Headers() headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) {
    this.logger.log("metadataRefresh", body.bookId)

    this.taskQueueService.enqueue(
      this.QUEUE_NAME,
      () =>
        from(
          this.booksMedataService.refreshMetadata(body, headers, user.email),
        ),
      {
        id: body.bookId,
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
            {
              authorization: event.data.authorization,
              "oboku-credentials": JSON.stringify(event.data.obokuCredentials),
            },
            event.data.email,
          ),
        ),
      {
        id: event.data.bookId,
      },
    )
  }
}
