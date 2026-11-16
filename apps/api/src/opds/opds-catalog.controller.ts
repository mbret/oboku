import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import type { Request, Response } from "express"
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
  OPDS_COVERS_ROUTE,
  OPDS_NAVIGATION_FEED_TYPE,
  OPDS_SHELVES_ROUTE,
  toBooksFeed,
  toOpds1Feed,
  toOpds2Feed,
  toRootFeed,
  toShelfFeed,
  toShelvesFeed,
} from "./opds-feeds.js"
import { OpdsBooksService } from "./opds-books.service.js"
import { IMMUTABLE_COVER_CACHE_CONTROL } from "../covers/covers.service.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"

/**
 * The catalog of an OPDS server, in OPDS 1.2 at its root and in OPDS 2.0
 * under `v2`. Readers sign in with HTTP Basic Auth, the account email and the
 * server's password, not an app session.
 */
const assertPageNumber = (page: number) => {
  const isPageNumber = page >= 1

  if (!isPageNumber) throw new BadRequestException()
}

@Public()
@ApiExcludeController()
@UseGuards(OpdsBasicAuthGuard)
@Controller(`${OPDS_CATALOG_ROUTE}/:slug`)
export class OpdsCatalogController {
  constructor(
    private readonly opdsBooksService: OpdsBooksService,
    private readonly proxiedDownloadQuotaService: ProxiedDownloadQuotaService,
  ) {}

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
  async getBooks(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds1Feed({
      slug: server.slug,
      feed: await this.findBooksFeed({ server, owner, page }),
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
  async getOpds2Books(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds2Feed({
      slug: server.slug,
      feed: await this.findBooksFeed({ server, owner, page }),
    })
  }

  @Get(OPDS_SHELVES_ROUTE)
  @Header("Content-Type", OPDS_NAVIGATION_FEED_TYPE)
  async getShelves(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds1Feed({
      slug: server.slug,
      feed: await this.findShelvesFeed({ server, owner, page }),
      updated: new Date(),
    })
  }

  @Get(`${OPDS_SHELVES_ROUTE}/:shelfId`)
  @Header("Content-Type", OPDS_ACQUISITION_FEED_TYPE)
  async getShelf(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Param("shelfId") shelfId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds1Feed({
      slug: server.slug,
      feed: await this.findShelfFeed({ server, owner, shelfId, page }),
      updated: new Date(),
    })
  }

  @Get(`${OPDS_2_ROUTE}/${OPDS_SHELVES_ROUTE}`)
  @Header("Content-Type", OPDS_2_FEED_TYPE)
  async getOpds2Shelves(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds2Feed({
      slug: server.slug,
      feed: await this.findShelvesFeed({ server, owner, page }),
    })
  }

  @Get(`${OPDS_2_ROUTE}/${OPDS_SHELVES_ROUTE}/:shelfId`)
  @Header("Content-Type", OPDS_2_FEED_TYPE)
  async getOpds2Shelf(
    @WithOpdsServer() server: OpdsServerPostgresEntity,
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Param("shelfId") shelfId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return toOpds2Feed({
      slug: server.slug,
      feed: await this.findShelfFeed({ server, owner, shelfId, page }),
    })
  }

  /**
   * The cover of a book the catalog serves. Its URL changes with the cover,
   * so reading apps may keep it as long as they like, but not a refusal: the
   * header goes out with the cover only.
   */
  @Get(`${OPDS_COVERS_ROUTE}/${OPDS_BOOKS_ROUTE}/:bookId`)
  async getBookCover(
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Param("bookId") bookId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cover = await this.opdsBooksService.deliverServedBookCover({
      owner,
      bookId,
    })

    response.setHeader("Cache-Control", IMMUTABLE_COVER_CACHE_CONTROL)

    return cover
  }

  /**
   * The file of a book the catalog serves. The last segment names the file
   * for reading apps that take the name from the link, KOReader among them.
   * A download that would pass the instance's or the user's monthly proxied
   * download quota answers 429 until the next month.
   */
  @Get(`${OPDS_BOOKS_ROUTE}/:bookId/:fileName`)
  async downloadBook(
    @WithOpdsOwner() owner: UserPostgresEntity,
    @Param("bookId") bookId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.opdsBooksService.streamServedBook({
      owner,
      bookId,
    })

    return this.proxiedDownloadQuotaService.deliver({
      userId: owner.id,
      file,
      request,
      response,
      attachment: { name: file.name, contentType: file.contentType },
    })
  }

  private async findBooksFeed({
    server,
    owner,
    page,
  }: {
    server: OpdsServerPostgresEntity
    owner: UserPostgresEntity
    page: number
  }) {
    assertPageNumber(page)

    const servedBooks = await this.opdsBooksService.listServedBooks({
      owner,
      page,
    })

    return toBooksFeed({ server, ...servedBooks })
  }

  private async findShelvesFeed({
    server,
    owner,
    page,
  }: {
    server: OpdsServerPostgresEntity
    owner: UserPostgresEntity
    page: number
  }) {
    assertPageNumber(page)

    const servedShelves = await this.opdsBooksService.listServedShelves({
      owner,
      page,
    })

    return toShelvesFeed({ server, ...servedShelves })
  }

  private async findShelfFeed({
    server,
    owner,
    shelfId,
    page,
  }: {
    server: OpdsServerPostgresEntity
    owner: UserPostgresEntity
    shelfId: string
    page: number
  }) {
    assertPageNumber(page)

    const servedShelf = await this.opdsBooksService.listServedShelfBooks({
      owner,
      shelfId,
      page,
    })

    return toShelfFeed({ server, ...servedShelf })
  }
}
