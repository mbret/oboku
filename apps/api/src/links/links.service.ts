import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { WebdavApiCredentials } from "@oboku/shared"
import { CouchService } from "../couch/couch.service.js"
import { findOne } from "../couch/dbHelpers.js"
import { toByteCount } from "../http/contentLength.js"
import { isRecord } from "../http/isRecord.js"
import { PluginsService } from "../plugins/plugins.service.js"
import type { ProxiedFile } from "../quotas/proxied-download-quota.service.js"

const toProviderFailure = (error: unknown) => {
  const isAnswerFromProvider =
    isRecord(error) && typeof error.status === "number"

  if (!isAnswerFromProvider) return error

  return error.status === 404
    ? new NotFoundException()
    : new BadGatewayException()
}

@Injectable()
export class LinksService {
  constructor(
    private readonly couchService: CouchService,
    private readonly pluginsService: PluginsService,
  ) {}

  /**
   * Streams the file of a WebDAV link in the library of the user `email`
   * names, from its server.
   *
   * @throws a 400 for a link of another type, a 404 when the library has no
   * such link or the server no such file, and a 502 when the server refuses
   * to describe the file.
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

    if (!link) throw new NotFoundException()

    const isWebdavLink = link.type === "webdav"

    if (!isWebdavLink) throw new BadRequestException()

    const { bookMetadata } = await this.pluginsService
      .getFileMetadata({ link, providerCredentials, db })
      .catch(function throwProviderFailure(error: unknown) {
        throw toProviderFailure(error)
      })
    const { stream, size } = await this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })

    return {
      stream,
      size,
      expectedSize: size ?? toByteCount(bookMetadata?.size),
    }
  }
}
