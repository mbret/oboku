import { Injectable } from "@nestjs/common"
import type { FileStat } from "webdav"
import { CouchService } from "../couch/couch.service.js"
import {
  findWebdavConnector,
  listWebdavDirectory,
} from "../plugins/webdav/index.js"
import { throwWebdavHttpException } from "../plugins/webdav/toWebdavHttpException.js"
import type { WebdavDirectoryItemDto } from "./connectors.dto.js"

const toWebdavDirectoryItem = (item: FileStat): WebdavDirectoryItemDto => ({
  filename: item.filename,
  basename: item.basename,
  type: item.type,
  mime: item.mime,
  etag: item.etag ?? undefined,
})

@Injectable()
export class ConnectorsService {
  constructor(private readonly couchService: CouchService) {}

  /**
   * The items of the directory at `path` on the server of the WebDAV
   * connector `connectorId`, read with `password`.
   *
   * @throws the answers `toWebdavHttpException` documents.
   */
  async listWebdavDirectory({
    email,
    connectorId,
    path,
    password,
  }: {
    email: string
    connectorId: string
    path: string
    password: string
  }): Promise<WebdavDirectoryItemDto[]> {
    const db = await this.couchService.createNanoInstanceForUser({ email })

    const readDirectory = async () => {
      const connector = await findWebdavConnector({ db, connectorId })

      return listWebdavDirectory({ connector, password, path })
    }

    const items = await readDirectory().catch(throwWebdavHttpException)

    return items.map(toWebdavDirectoryItem)
  }
}
