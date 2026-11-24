import {
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
import { toObokuErrorBody } from "../http/obokuBadRequest.js"
import { findWebdavConnector } from "../plugins/webdav/index.js"
import { streamWebdavFile } from "../plugins/webdav/streamWebdavFile.js"
import { throwWebdavHttpException } from "../plugins/webdav/toWebdavHttpException.js"
import type { ProxiedFile } from "../quotas/proxied-download-quota.service.js"

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

const createResourceNotFound = () =>
  new NotFoundException(
    toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
  )

const streamConnectorFile = async ({
  db,
  link,
  providerCredentials,
}: {
  db: createNano.DocumentScope<unknown>
  link: LinkDocTypeForProvider<"webdav">
  providerCredentials: WebdavApiCredentials
}) => {
  const connector = await findWebdavConnector({
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
   * @throws a 400 for a link of another type, a link that names no connector
   * or one the user's settings do not hold, or an address the instance does
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

    const { stream, name, contentType, size, expectedSize } =
      await streamConnectorFile({ db, link, providerCredentials }).catch(
        throwWebdavHttpException,
      )

    return {
      stream,
      name: name ?? link.data.filePath.split("/").pop() ?? link._id,
      contentType: contentType || UNKNOWN_CONTENT_TYPE,
      size,
      expectedSize,
    }
  }
}
