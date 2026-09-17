import { Injectable, Logger } from "@nestjs/common"
import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { AppConfigService } from "src/config/AppConfigService"
import { CouchService } from "src/couch/couch.service"
import { findOne } from "src/lib/couch/findOne"
import {
  assertSafeRequestTarget,
  isPrivateNetworkAllowed,
} from "src/lib/http/requestTarget"
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

@Injectable()
export class DownloadService {
  private logger = new Logger(DownloadService.name)

  constructor(
    private readonly appConfigService: AppConfigService,
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
    if (!this.appConfigService.DOWNLOAD_PROXY_ENABLED) {
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

    const plugin = getPlugin(link.type)

    if (!plugin?.getDownloadTargetUrl) {
      throw new LinkNotProxyableError(link.type)
    }

    const target = await plugin.getDownloadTargetUrl(link, db)

    await assertSafeRequestTarget(target, {
      allowPrivateNetwork: isPrivateNetworkAllowed(),
    })

    this.logger.log(`Proxying download of link ${linkId} (${link.type})`)

    const { stream } = await this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })

    return { stream, link }
  }
}
