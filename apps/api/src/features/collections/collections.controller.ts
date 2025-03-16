import { Body, Controller, Headers, Post } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { CollectionMetadataRefreshEvent, Events } from "../../events"
import { CollectionMetadataService } from "./CollectionMetadataService"
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
  constructor(private collectionMetadataService: CollectionMetadataService) {}

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

  @OnEvent(Events.COLLECTION_METADATA_REFRESH)
  async handleMetadataRefresh(event: CollectionMetadataRefreshEvent) {
    return this.collectionMetadataService.refreshMetadata({
      collectionId: event.data.collectionId,
      credentials: event.data.obokuCredentials,
      authorization: event.data.authorization,
      soft: event.data.soft,
    })
  }
}
