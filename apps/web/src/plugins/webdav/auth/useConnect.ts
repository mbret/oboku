import { useQuery } from "@tanstack/react-query"
import { connectWebdav } from "./connect"

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
      try {
        await connectWebdav({
          url: data.url,
          username: data.username,
          password: data.password,
          path: data.directory,
        })
        return true
      } catch {
        return false
      }
    },
  })
}
