import { Body, Controller, Headers, Post } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { EnvironmentVariables } from "./types"
import { OnEvent } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "./events"
import { refreshMetadata } from "./features/books/metadata/refreshMetadata"
import { CollectionMetadataService } from "./features/collections/CollectionMetadataService"
import { IsBoolean, IsString, IsOptional } from "class-validator"

class PostMetadataRefreshDto {
  @IsString()
  collectionId!: string

  @IsBoolean()
  @IsOptional()
  soft?: boolean
}

@Controller("collections")
export class CollectionsController {
  constructor(
    private configService: ConfigService<EnvironmentVariables>,
    private collectionMetadataService: CollectionMetadataService,
  ) {}

  @Post("metadata/refresh")
  async metadataRefresh(
    @Body() body: PostMetadataRefreshDto,
    @Headers() headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) {
    return this.collectionMetadataService.refreshMetadata({
      collectionId: body.collectionId,
      credentials: JSON.parse(headers["oboku-credentials"] ?? "{}"),
      authorization: headers.authorization ?? "",
      soft: body.soft,
    })
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
