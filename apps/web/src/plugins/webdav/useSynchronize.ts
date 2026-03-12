import type { WebDAVDataSourceDocType } from "@oboku/shared"
import type { UseSynchronizeHook } from "../types"
import { from } from "rxjs"
import { map } from "rxjs"
import { useMutation$ } from "reactjrx"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useSynchronize: UseSynchronizeHook<"webdav"> = () => {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: "webdav",
  })

  return useMutation$({
    mutationFn: (dataSource: WebDAVDataSourceDocType) => {
      const connectorId = dataSource.data_v2?.connectorId

      if (!connectorId) {
        throw new Error("No connector id")
      }

      return from(extractConnectorData({ connectorId })).pipe(
        map((res) => ({
          providerCredentials: { password: res.data.password },
        })),
      )
    },
  })
}
