import { useQuery } from "@tanstack/react-query"
import { AuthType, createClient } from "webdav"

fetch("", {
  credentials: "include",
})
export const useConnect = ({
  data,
  enabled = true,
}: {
  data: { url: string; username: string; password: string }
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
        await client.getDirectoryContents("/")
      } catch (error) {
        return false
      }

      return true
    },
  })
}
