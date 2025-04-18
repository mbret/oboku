import { useCallback } from "react"
import type { ObokuPlugin } from "../types"
import { firstValueFrom } from "rxjs"
import { useRequestMasterKey } from "../../secrets/useRequestMasterKey"
import { useMutation$ } from "reactjrx"

export const useRefreshMetadata: ObokuPlugin<"webdav">[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey()

  return useMutation$({
    mutationFn: async (asd) => {
      const passwordAsSecretId = dataSource.data_v2?.passwordAsSecretId

      if (!passwordAsSecretId) {
        throw new Error("No password as secret id")
      }
    },
  })
}
