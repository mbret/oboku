import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request, Response } from "express"
import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { parseBasicAuthorization } from "../http/basicAuthorization.js"
import { OpdsCatalogService } from "./opds-catalog.service.js"

const OPDS_BASIC_CHALLENGE = 'Basic realm="oboku-opds", charset="UTF-8"'

type OpdsCatalogRequest = Request<{ slug?: string }> & {
  opdsServer?: OpdsServerPostgresEntity
}

/**
 * Signs a reader in to the server of the URL's slug with HTTP Basic Auth. A
 * missing header, an unknown slug and wrong credentials all answer the same
 * 401 and challenge, so a reader cannot tell which servers or emails exist.
 */
@Injectable()
export class OpdsBasicAuthGuard implements CanActivate {
  constructor(private readonly opdsCatalogService: OpdsCatalogService) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp()
    const request = http.getRequest<OpdsCatalogRequest>()
    const credentials = parseBasicAuthorization(request.headers.authorization)
    const { slug } = request.params

    const server =
      credentials && slug
        ? await this.opdsCatalogService.authorize({ slug, ...credentials })
        : undefined

    if (!server) {
      http.getResponse<Response>().set("WWW-Authenticate", OPDS_BASIC_CHALLENGE)

      throw new UnauthorizedException()
    }

    request.opdsServer = server

    return true
  }
}

export const WithOpdsServer = createParamDecorator(function getOpdsServer(
  _,
  context: ExecutionContext,
) {
  const { opdsServer } = context.switchToHttp().getRequest<OpdsCatalogRequest>()

  if (!opdsServer) throw new UnauthorizedException()

  return opdsServer
})
