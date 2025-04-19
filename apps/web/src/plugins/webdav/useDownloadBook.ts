import type { ObokuPlugin } from "../types"
import { from, map, switchMap } from "rxjs"
import { useExtractConnectorData } from "./connectors/useExtractConnectorData"
import { getWebDavLinkData, explodeWebdavResourceId } from "@oboku/shared"
import { createClient } from "webdav"

/**
 * @important
 * No progress support anymore @see https://github.com/perry-mitchell/webdav-client/issues/319#issuecomment-1328323167
 */
export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData()

  return ({ link }) => {
    const { connectorId } = getWebDavLinkData(link.data ?? {})
    const { filename } = explodeWebdavResourceId(link.resourceId)

    if (!connectorId) {
      throw new Error("No connector id")
    }

    return from(extractConnectorData({ connectorId })).pipe(
      switchMap(({ data }) => {
        const client = createClient(data.url, {
          username: data.username,
          password: data.password,
        })

        return from(
          client.getFileContents(filename, {
            format: "binary",
          }),
        )
      }),
      map((data) => {
        if (data instanceof ArrayBuffer) {
          return {
            data: new Blob([data]),
            name: filename,
          }
        }

        throw new Error("Unknown data type")
      }),
    )
  }
}
