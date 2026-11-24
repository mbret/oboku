import type {
  ConnectionParams,
  TestConnectionFn,
} from "../../../connectors/TestConnection"
import { useHttpClientApi } from "../../../http"
import { createWebdavDirectoryLister } from "./listDirectory"

type WebdavConnectionParams = ConnectionParams & { directory?: string }

const toPath = (params: WebdavConnectionParams) =>
  `/${params.directory ?? ""}`.replace(/\/+/g, "/") || "/"

export const useTestWebdavConnection =
  (): TestConnectionFn<WebdavConnectionParams> => {
    const httpClientApi = useHttpClientApi()

    return async function testWebdavConnection(params) {
      const listDirectory = createWebdavDirectoryLister({
        connection: params,
        httpClientApi,
      })

      try {
        await listDirectory(toPath(params))
        return true
      } catch {
        return false
      }
    }
  }
