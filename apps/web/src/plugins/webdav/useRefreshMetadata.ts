import type { ObokuPlugin } from "../types"
import { from } from "rxjs"
import { useMutation$ } from "reactjrx"
import { type DataSourceDocType, getWebDavLinkData } from "@oboku/shared"
import { useExtractConnectorData } from "./connectors/useExtractConnectorData"

export const useRefreshMetadata: ObokuPlugin<"webdav">[`useRefreshMetadata`] =
  () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData()
    
    return useMutation$({
      mutationFn: ({
        linkData,
      }: {
        linkType: DataSourceDocType["type"]
        linkData: Record<string, unknown>
      }) => {
        const { connectorId } = getWebDavLinkData(linkData)

        if (!connectorId) {
          throw new Error("You need to setup a webdav connector first")
        }

        return from(extractConnectorData({ connectorId }))
      },
    })
  }
