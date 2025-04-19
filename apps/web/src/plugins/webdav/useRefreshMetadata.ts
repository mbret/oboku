import type { ObokuPlugin } from "../types"
import { of } from "rxjs"
import { useRequestMasterKey } from "../../secrets/useRequestMasterKey"
import { useMutation$ } from "reactjrx"
import { type DataSourceDocType, getWebDavLinkData } from "@oboku/shared"

export const useRefreshMetadata: ObokuPlugin<"webdav">[`useRefreshMetadata`] =
  () => {
    const { mutateAsync: requestMasterKey } = useRequestMasterKey()

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

        return of({ data: {} })
      },
    })
  }
