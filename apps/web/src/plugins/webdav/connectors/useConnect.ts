import { useQuery } from "@tanstack/react-query"
import { AuthType, createClient } from "webdav"

export const useConnect = ({
  data,
  enabled = true,
}: {
  data: { url: string; username: string; password: string; directory: string }
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ["webdav", "connect", data],
    retry: false,
    enabled,
    queryFn: async () => {
      const client = createClient(data.url, {
        username: data.username,
        password: data.password,
        authType: AuthType.Auto,
      })

      try {
        await client.getDirectoryContents(data.directory)
      } catch (_error) {
        return false
      }

      return true
    },
  })
}
