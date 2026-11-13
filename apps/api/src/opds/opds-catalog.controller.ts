import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import type { Response } from "express"
import { Public } from "../auth/auth.guard.js"
import type {
  OpdsServerPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import {
  OpdsBasicAuthGuard,
  WithOpdsOwner,
  WithOpdsServer,
} from "./opds-basic-auth.guard.js"
import {
  OPDS_2_FEED_TYPE,
  OPDS_2_ROUTE,
  OPDS_ACQUISITION_FEED_TYPE,
  OPDS_BOOKS_ROUTE,
  OPDS_CATALOG_ROUTE,
  OPDS_NAVIGATION_FEED_TYPE,
  toBooksFeed,
  toOpds1Feed,
  toOpds2Feed,
  toRootFeed,
} from "./opds-feeds.js"
import { OpdsLibraryService } from "./opds-library.service.js"

/**
 * The catalog of an OPDS server, in OPDS 1.2 at its root and in OPDS 2.0
 * under `v2`. Readers sign in with HTTP Basic Auth, the account email and the
 * server's password, not an app session.
 */
@Public()
@ApiExcludeController()
@UseGuards(OpdsBasicAuthGuard)
@Controller(`${OPDS_CATALOG_ROUTE}/:slug`)
export class OpdsCatalogController {
  constructor(private readonly opdsLibraryService: OpdsLibraryService) {}

  @Get()
  @Header("Content-Type", OPDS_NAVIGATION_FEED_TYPE)
  getRoot(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return toOpds1Feed({
      slug: server.slug,
      feed: toRootFeed(server),
      updated: new Date(),
    })
  }

  @Get(OPDS_BOOKS_ROUTE)
  @Header("Content-Type", OPDS_ACQUISITION_FEED_TYPE)
  getBooks(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return toOpds1Feed({
      slug: server.slug,
      feed: toBooksFeed(server),
      updated: new Date(),
    })
  }

  @Get(OPDS_2_ROUTE)
  @Header("Content-Type", OPDS_2_FEED_TYPE)
  getOpds2Root(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return toOpds2Feed({ slug: server.slug, feed: toRootFeed(server) })
  }

  @Get(`${OPDS_2_ROUTE}/${OPDS_BOOKS_ROUTE}`)
  @Header("Content-Type", OPDS_2_FEED_TYPE)
  getOpds2Books(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return toOpds2Feed({ slug: server.slug, feed: toBooksFeed(server) })
  }

  /**
   * The file of a book the catalog serves. The last segment names the file
   * for reading apps that take the name from the link, KOReader among them.
   */
  @Get(`${OPDS_BOOKS_ROUTE}/:bookId/:fileName`)
  async downloadBook(
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Param("bookId") bookId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.opdsLibraryService.openServedFile({
      owner,
      bookId,
    })

    // `attachment` types the response from the name's extension: the book's
    // own media type replaces it.
    response.attachment(file.name).type(file.contentType)

    return new StreamableFile(file.stream, { length: file.size })
  }
}
