import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  type LinkDocTypeForProvider,
  ObokuErrorCode,
  type WebdavApiCredentials,
} from "@oboku/shared"
import type createNano from "nano"
import { CouchService } from "../couch/couch.service.js"
import { findOne } from "../couch/dbHelpers.js"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../http/publicAddress.js"
import {
  findLinkConnector,
  isSignInRefused,
  toAnsweredStatus,
} from "../plugins/webdav/index.js"
import {
  FileSizeUnstatedError,
  streamWebdavFile,
} from "../plugins/webdav/streamWebdavFile.js"
import type { ProxiedFile } from "../quotas/proxied-download-quota.service.js"

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

const createResourceNotFound = () =>
  new NotFoundException(
    toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
  )

const toServerFailure = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  if (error instanceof FileSizeUnstatedError) {
    return new BadGatewayException(
      toObokuErrorBody(ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_SIZE_UNKNOWN),
    )
  }

  if (toAnsweredStatus(error) === 404) return createResourceNotFound()

  if (isSignInRefused(error)) {
    return new BadGatewayException(
      toObokuErrorBody(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
      ),
    )
  }

  return new BadGatewayException(
    toObokuErrorBody(
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
    ),
  )
}

const throwServerFailure = (error: unknown): never => {
  throw toServerFailure(error)
}

const streamConnectorFile = async ({
  db,
  link,
  providerCredentials,
}: {
  db: createNano.DocumentScope<unknown>
  link: LinkDocTypeForProvider<"webdav">
  providerCredentials: WebdavApiCredentials
}) => {
  const connector = await findLinkConnector({
    db,
    connectorId: link.data.connectorId,
  })

  return streamWebdavFile({
    connector,
    password: providerCredentials.password,
    filePath: link.data.filePath,
  })
}

@Injectable()
export class LinksService {
  constructor(private readonly couchService: CouchService) {}

  /**
   * Streams the file of a WebDAV link in the library of the user `email`
   * names, from its server. The stream fails past the size the server states:
   * the server is the user's, and could state less than it sends.
   *
   * @throws a 400 for a link of another type or an address the instance does
   * not reach, a 404 when the library has no such link or the server no such
   * file, and a 502 when the server refuses the password or the file, cannot
   * be reached, or states no size for the file.
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

    const { stream, name, contentType, statedSize } = await streamConnectorFile(
      { db, link, providerCredentials },
    ).catch(throwServerFailure)

    return {
      stream,
      name: name ?? link.data.filePath.split("/").pop() ?? link._id,
      contentType: contentType || UNKNOWN_CONTENT_TYPE,
      expectedSize: statedSize,
    }
  }
}
