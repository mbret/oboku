import { Injectable } from "@nestjs/common"
import type { FileStat } from "webdav"
import { listWebdavDirectory } from "../plugins/webdav/index.js"
import { throwWebdavHttpException } from "../plugins/webdav/toWebdavHttpException.js"
import type {
  ListWebdavDirectoryDto,
  WebdavDirectoryItemDto,
} from "./connectors.dto.js"

const LIST_DIRECTORY_DEADLINE_MS = 30_000

const toWebdavDirectoryItem = (item: FileStat): WebdavDirectoryItemDto => ({
  filename: item.filename,
  basename: item.basename,
  type: item.type,
  mime: item.mime,
  etag: item.etag ?? undefined,
})

@Injectable()
export class ConnectorsService {
  async listWebdavDirectory({
    url,
    username,
    providerCredentials,
    allowSelfSigned,
    path,
  }: ListWebdavDirectoryDto): Promise<WebdavDirectoryItemDto[]> {
    const items = await listWebdavDirectory({
      url,
      username,
      password: providerCredentials.password,
      allowSelfSigned,
      path,
      signal: AbortSignal.timeout(LIST_DIRECTORY_DEADLINE_MS),
    }).catch(throwWebdavHttpException)

    return items.map(toWebdavDirectoryItem)
  }
}
