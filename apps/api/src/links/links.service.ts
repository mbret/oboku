import { pipeline } from "node:stream"
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { ObokuErrorCode, type WebdavApiCredentials } from "@oboku/shared"
import { CouchService } from "../couch/couch.service.js"
import { findOne } from "../couch/dbHelpers.js"
import { toByteCount } from "../http/contentLength.js"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../http/publicAddress.js"
import {
  createByteLimitTransform,
  PluginsService,
} from "../plugins/plugins.service.js"
import { isSignInRefused, toAnsweredStatus } from "../plugins/webdav/index.js"
import type { ProxiedFile } from "../quotas/proxied-download-quota.service.js"

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

const createResourceNotFound = () =>
  new NotFoundException(
    toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
  )

const createServerUnreachable = () =>
  new BadGatewayException(
    toObokuErrorBody(
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
    ),
  )

const toServerFailure = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  if (toAnsweredStatus(error) === 404) return createResourceNotFound()

  if (isSignInRefused(error)) {
    return new BadGatewayException(
      toObokuErrorBody(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
      ),
    )
  }

  return createServerUnreachable()
}

@Injectable()
export class LinksService {
  constructor(
    private readonly couchService: CouchService,
    private readonly pluginsService: PluginsService,
  ) {}

  /**
   * Streams the file of a WebDAV link in the library of the user `email`
   * names, from its server. The stream fails past the size the server states:
   * the server is the user's, and could state less than it sends.
   *
   * @throws a 400 for a link of another type or an address the instance does
   * not reach, a 404 when the library has no such link or the server no such
   * file, and a 502 when the server refuses the password, cannot be reached,
   * or states no size.
   */
  async streamLinkFile({
    email,
    linkId,
    providerCredentials,
  }: {
    email: string
    linkId: string
    providerCredentials: WebdavApiCredentials
  }): Promise<ProxiedFile> {
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const link = await findOne("link", { selector: { _id: linkId } }, { db })

    if (!link) throw createResourceNotFound()

    const isWebdavLink = link.type === "webdav"

    if (!isWebdavLink) throw new BadRequestException()

    const { name, contentType, bookMetadata } = await this.pluginsService
      .getFileMetadata({ link, providerCredentials, db })
      .catch(function throwServerFailure(error: unknown) {
        throw toServerFailure(error)
      })
    const statedSize = toByteCount(bookMetadata?.size)
    const isSizeStated = statedSize !== undefined && statedSize > 0

    if (!isSizeStated) throw createServerUnreachable()

    const { stream } = await this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })

    return {
      // Errors reach the route through the stream the quota meters.
      stream: pipeline(
        stream,
        createByteLimitTransform(statedSize),
        function leaveErrorsToTheMeteredStream() {},
      ),
      name: name ?? link.data.filePath.split("/").pop() ?? link._id,
      contentType: contentType || UNKNOWN_CONTENT_TYPE,
      expectedSize: statedSize,
    }
  }
}
