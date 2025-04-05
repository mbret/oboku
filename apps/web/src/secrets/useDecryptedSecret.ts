import { useQuery } from "@tanstack/react-query"
import { useSecret } from "./useSecret"
import { useMemo } from "react"
import { decryptSecret } from "./secretsUtils"

export const useDecryptedSecret = ({
  id,
  masterKey,
}: { id?: string; masterKey?: string }) => {
  const { data: secret } = useSecret(id)
  const uuid = useMemo(
    () => (masterKey ? crypto.randomUUID() : undefined),
    [masterKey],
  )

  return useQuery({
    queryKey: ["secret/decrypted", { id, uuid }],
    enabled: !!secret && !!masterKey,
    retry: false,
    queryFn: async () => {
      if (!secret?.value) throw new Error("Secret not found")

      return await decryptSecret(secret.value, masterKey ?? "")
    },
  })
}
