import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  isOpdsBookLinkData,
  type LinkDocTypeForSource,
  ObokuErrorCode,
  type OpdsBookLinkData,
  withReaderFileExtension,
} from "@oboku/shared"
import type createNano from "nano"
import type { ConnectorCredentialsDto } from "../connectors/connector-credentials.dto.js"
import { CouchService } from "../couch/couch.service.js"
import { findOne } from "../couch/dbHelpers.js"
import { toObokuErrorBody } from "../http/obokuBadRequest.js"
import { findConnector } from "../plugins/connectorHelpers.js"
import { resolveOpdsConnector } from "../plugins/opds/index.js"
import { streamOpdsFile } from "../plugins/opds/streamOpdsFile.js"
import {
  throwConnectorHttpException,
  throwWebAddressHttpException,
} from "../plugins/toConnectorHttpException.js"
import { streamUriFile } from "../plugins/uri/streamUriFile.js"
import { streamWebdavFile } from "../plugins/webdav/streamWebdavFile.js"
import type { ProxiedFile } from "../quotas/proxied-download-quota.service.js"

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

type UserDb = createNano.DocumentScope<unknown>

type SourceFile = Omit<ProxiedFile, "contentType"> & {
  contentType: string | undefined
}

const createResourceNotFound = () =>
  new NotFoundException(
    toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
  )

const requireConnectorPassword = (
  providerCredentials: ConnectorCredentialsDto | undefined,
) => {
  if (!providerCredentials) throw new BadRequestException()

  return providerCredentials.password
}

/** The app takes a proxied book's format from its file name. */
const toProxiedFile = ({
  name,
  contentType,
  ...file
}: SourceFile): ProxiedFile => ({
  ...file,
  name: withReaderFileExtension(name, contentType),
  contentType: contentType || UNKNOWN_CONTENT_TYPE,
})

const streamWebdavLinkFile = async ({
  db,
  link,
  password,
}: {
  db: UserDb
  link: LinkDocTypeForSource<"webdav">
  password: string
}): Promise<SourceFile> => {
  const connector = await findConnector({
    db,
    connectorId: link.data.connectorId,
    type: "webdav",
  })
  const { name, ...file } = await streamWebdavFile({
    connector,
    password,
    filePath: link.data.filePath,
  })

  return {
    ...file,
    name: name ?? link.data.filePath.split("/").pop() ?? link._id,
  }
}

const streamOpdsLinkFile = async ({
  db,
  bookLinkData: { connectorId, acquisition, title },
  password,
}: {
  db: UserDb
  bookLinkData: OpdsBookLinkData
  password: string
}) => {
  const connector = await resolveOpdsConnector({ connectorId, password, db })

  return streamOpdsFile({ connector, acquisition, title })
}

@Injectable()
export class LinksService {
  constructor(private readonly couchService: CouchService) {}

  /**
   * Streams the file of a WebDAV link, an OPDS book or a web address in the
   * library of the user `email` names. The stream fails past the size the
   * server states, which could be less than it sends. The file's name ends
   * with the extension of its type.
   *
   * @throws a 400 for a link of another type or an OPDS link to a folder, a
   * WebDAV or OPDS link without `providerCredentials`, a link that names no
   * connector or one the user's settings do not hold, or an address the
   * instance does not reach, a 404 when the library has no such link or the
   * server no such file, and a 502 when the server refuses the password or
   * the file, cannot be reached, or states no size for the file.
   */
  async streamLinkFile({
    email,
    linkId,
    providerCredentials,
  }: {
    email: string
    linkId: string
    providerCredentials: ConnectorCredentialsDto | undefined
  }): Promise<ProxiedFile> {
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const link = await findOne("link", { selector: { _id: linkId } }, { db })

    if (!link) throw createResourceNotFound()

    switch (link.type) {
      case "webdav":
        return streamWebdavLinkFile({
          db,
          link,
          password: requireConnectorPassword(providerCredentials),
        }).then(toProxiedFile, throwConnectorHttpException)
      case "opds":
        if (!isOpdsBookLinkData(link.data)) throw new BadRequestException()

        return streamOpdsLinkFile({
          db,
          bookLinkData: link.data,
          password: requireConnectorPassword(providerCredentials),
        }).then(toProxiedFile, throwConnectorHttpException)
      case "URI":
        return streamUriFile(link.data).then(
          toProxiedFile,
          throwWebAddressHttpException,
        )
      default:
        throw new BadRequestException()
    }
  }
}
