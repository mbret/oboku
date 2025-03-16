import { Body, Controller, Headers, Logger, Post } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { EnvironmentVariables } from "./types"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "./events"
import { refreshMetadata } from "./features/books/metadata/refreshMetadata"

@Controller("books")
export class BooksController {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  @Post("metadata/refresh")
  async metadataRefresh(
    @Body() body: { bookId: string },
    @Headers() headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) {
    return refreshMetadata(body, headers, this.configService)
  }

  @OnEvent(Events.BOOKS_METADATA_REFRESH)
  async handleBooksMetadataRefresh(event: BooksMetadataRefreshEvent) {
    refreshMetadata(
      {
        bookId: event.data.bookId,
      },
      {
        authorization: event.data.authorization,
        "oboku-credentials": JSON.stringify(event.data.obokuCredentials),
      },
      this.configService,
    )
  }
}
