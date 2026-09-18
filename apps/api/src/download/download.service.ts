import { Injectable, Logger } from "@nestjs/common"
import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { InstanceConfigService } from "src/admin/instance-config/instance-config.service"
import { CouchService } from "src/couch/couch.service"
import { findOne } from "src/lib/couch/findOne"
import { getPlugin } from "src/plugins/plugins"
import { PluginsService } from "src/plugins/plugins.service"

export class DownloadProxyDisabledError extends Error {
  constructor() {
    super("The download proxy is not enabled on this instance")
  }
}

export class LinkNotProxyableError extends Error {
  constructor(type: string) {
    super(`Links of type ${type} cannot be downloaded through the proxy`)
  }
}

export class LinkNotFoundError extends Error {
  constructor(linkId: string) {
    super(`No link ${linkId} for this user`)
  }
}

const DEFAULT_CONTENT_TYPE = "application/octet-stream"

@Injectable()
export class DownloadService {
  private logger = new Logger(DownloadService.name)

  constructor(
    private readonly instanceConfigService: InstanceConfigService,
    private readonly couchService: CouchService,
    private readonly pluginsService: PluginsService,
  ) {}

  async streamLink({
    linkId,
    providerCredentials,
    email,
  }: {
    linkId: string
    providerCredentials: ProviderApiCredentials<DataSourceType>
    email: string
  }) {
    const { downloadProxyEnabled, downloadProxyMaxSizeBytes } =
      this.instanceConfigService.getConfig().value

    if (!downloadProxyEnabled) {
      throw new DownloadProxyDisabledError()
    }

    const db = await this.couchService.createNanoInstanceForUser({ email })

    /**
     * Scoping the lookup to the caller's own database is what authorizes the
     * fetch: a link id from another user simply does not resolve here.
     */
    const link = await findOne("link", { selector: { _id: linkId } }, { db })

    if (!link) {
      throw new LinkNotFoundError(linkId)
    }

    if (!getPlugin(link.type)?.canProxyDownload) {
      throw new LinkNotProxyableError(link.type)
    }

    /**
     * The provider's own name and content type are fetched before streaming
     * because the reader classifies an archive by extension or mime type, and
     * link data alone does not carry either for providers whose identity is an
     * opaque id (Synology Drive, Google Drive).
     */
    const metadata = await this.pluginsService.getFileMetadata({
      link,
      providerCredentials,
      db,
    })

    this.logger.log(`Proxying download of link ${linkId} (${link.type})`)

    const { stream } = await this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })

    const reportedSize = Number(metadata.bookMetadata?.size)

    return {
      stream,
      maxSizeBytes: downloadProxyMaxSizeBytes,
      fileName: metadata.name,
      contentType:
        metadata.contentType ??
        metadata.bookMetadata?.contentType ??
        DEFAULT_CONTENT_TYPE,
      sizeBytes: Number.isFinite(reportedSize) ? reportedSize : undefined,
    }
  }
}
