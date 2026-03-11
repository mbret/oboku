import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import { firstValueFrom, from } from "rxjs"
import { map } from "rxjs"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useRefreshMetadata: ObokuPlugin<"webdav">[`useRefreshMetadata`] =
  () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "webdav",
    })

    return useMutation({
      mutationFn: ({ linkData }) => {
        const connectorId =
          linkData && typeof linkData === "object" && "connectorId" in linkData
            ? linkData.connectorId
            : undefined

        if (!connectorId) {
          throw new Error("You need to setup a webdav connector first")
        }

        return firstValueFrom(
          from(extractConnectorData({ connectorId })).pipe(
            map((res) => ({
              providerCredentials: {
                password: res.data.password,
              },
            })),
          ),
        )
      },
    })
  }
