import { Controller, Get, Header, UseGuards } from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import { Public } from "../auth/auth.guard.js"
import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { OpdsBasicAuthGuard, WithOpdsServer } from "./opds-basic-auth.guard.js"
import {
  buildBooksFeed,
  buildRootFeed,
  OPDS_ACQUISITION_FEED_TYPE,
  OPDS_NAVIGATION_FEED_TYPE,
} from "./opds-feeds.js"

/**
 * The OPDS 1.2 catalog of an OPDS server. Readers sign in with HTTP Basic
 * Auth, the account email and the server's password, never with a session:
 * the app's own auth does not apply here.
 */
@Public()
@ApiExcludeController()
@UseGuards(OpdsBasicAuthGuard)
@Controller("opds/:slug")
export class OpdsCatalogController {
  @Get()
  @Header("Content-Type", OPDS_NAVIGATION_FEED_TYPE)
  getRoot(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return buildRootFeed({ server, updated: new Date() })
  }

  @Get("books")
  @Header("Content-Type", OPDS_ACQUISITION_FEED_TYPE)
  getBooks(@WithOpdsServer() server: OpdsServerPostgresEntity) {
    return buildBooksFeed({ server, updated: new Date() })
  }
}
