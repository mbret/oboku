import { Body, Controller, Headers, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "../../events"
import { BooksMedataService } from "./BooksMedataService"

@Controller("books")
export class BooksController {
  constructor(private booksMedataService: BooksMedataService) {}

  @Post("metadata/refresh")
  async metadataRefresh(
    @Body() body: { bookId: string },
    @Headers() headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) {
    return this.booksMedataService.refreshMetadata(body, headers)
  }

  @OnEvent(Events.BOOKS_METADATA_REFRESH)
  async handleBooksMetadataRefresh(event: BooksMetadataRefreshEvent) {
    this.booksMedataService.refreshMetadata(
      {
        bookId: event.data.bookId,
      },
      {
        authorization: event.data.authorization,
        "oboku-credentials": JSON.stringify(event.data.obokuCredentials),
      },
    )
  }
}
