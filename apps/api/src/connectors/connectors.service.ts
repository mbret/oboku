import { Injectable } from "@nestjs/common"
import type createNano from "nano"
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

const LIST_DIRECTORY_DEADLINE_MS = 30_000

const listConnectorDirectory = async ({
  db,
  connectorId,
  password,
  path,
}: {
  db: createNano.DocumentScope<unknown>
  connectorId: string
  password: string
  path: string
}) => {
  const connector = await findWebdavConnector({ db, connectorId })

  return listWebdavDirectory({
    connector,
    password,
    path,
    signal: AbortSignal.timeout(LIST_DIRECTORY_DEADLINE_MS),
  })
}

@Injectable()
export class ConnectorsService {
  constructor(private readonly couchService: CouchService) {}

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
    const items = await listConnectorDirectory({
      db,
      connectorId,
      password,
      path,
    }).catch(throwWebdavHttpException)

    return items.map(toWebdavDirectoryItem)
  }
}
