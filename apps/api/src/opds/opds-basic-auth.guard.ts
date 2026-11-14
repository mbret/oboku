import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request, Response } from "express"
import type {
  OpdsServerPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { parseBasicAuthorization } from "../http/basicAuthorization.js"
import { getRequestOrigin } from "../http/requestOrigin.js"
import { OpdsAuthService } from "./opds-auth.service.js"
import {
  OPDS_AUTHENTICATION_DOCUMENT_TYPE,
  toAuthenticationDocument,
} from "./opds-feeds.js"

const OPDS_BASIC_CHALLENGE = 'Basic realm="oboku-opds", charset="UTF-8"'

type OpdsCatalogRequest = Request<{ slug: string }> & {
  opdsServer?: OpdsServerPostgresEntity
  opdsOwner?: UserPostgresEntity
}

/**
 * Signs a reader in to the server of the URL's slug with HTTP Basic Auth.
 * Every refusal answers the same 401, Basic challenge and authentication
 * document, so a reader cannot tell which servers or emails exist.
 */
@Injectable()
export class OpdsBasicAuthGuard implements CanActivate {
  constructor(private readonly opdsAuthService: OpdsAuthService) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp()
    const request = http.getRequest<OpdsCatalogRequest>()
    const credentials = parseBasicAuthorization(request.headers.authorization)
    const { slug } = request.params

    const access = credentials
      ? await this.opdsAuthService.authorize({ slug, ...credentials })
      : undefined

    if (!access) {
      http.getResponse<Response>().set({
        "WWW-Authenticate": OPDS_BASIC_CHALLENGE,
        "Content-Type": OPDS_AUTHENTICATION_DOCUMENT_TYPE,
      })

      throw new UnauthorizedException(
        toAuthenticationDocument({ origin: getRequestOrigin(request), slug }),
      )
    }

    request.opdsServer = access.server
    request.opdsOwner = access.owner

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

/** The account that owns the server the reader signed in to. */
export const WithOpdsOwner = createParamDecorator(function getOpdsOwner(
  _,
  context: ExecutionContext,
) {
  const { opdsOwner } = context.switchToHttp().getRequest<OpdsCatalogRequest>()

  if (!opdsOwner) throw new UnauthorizedException()

  return opdsOwner
})
