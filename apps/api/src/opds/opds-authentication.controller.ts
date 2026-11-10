import { Controller, Get, Header, Param } from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import { Public } from "../auth/auth.guard.js"
import {
  OPDS_AUTHENTICATION_DOCUMENT_TYPE,
  OPDS_AUTHENTICATION_ROUTE,
  OPDS_CATALOG_ROUTE,
  toAuthenticationDocument,
} from "./opds-feeds.js"

/** Authentication for OPDS 1.0 §2.2: reading it requires no sign-in. */
@Public()
@ApiExcludeController()
@Controller(`${OPDS_CATALOG_ROUTE}/:slug/${OPDS_AUTHENTICATION_ROUTE}`)
export class OpdsAuthenticationController {
  @Get()
  @Header("Content-Type", OPDS_AUTHENTICATION_DOCUMENT_TYPE)
  getAuthenticationDocument(@Param("slug") slug: string) {
    return toAuthenticationDocument(slug)
  }
}
