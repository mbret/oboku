import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { type DriveFileGetResponse, useDriveFilesGet } from "./useDriveFilesGet"
import { firstValueFrom } from "rxjs"
import { useCallback } from "react"
import { useGapi } from "../plugins/google/lib/gapi"
import { useAccessToken } from "./auth"

export const getUseDriveFileQueryKey = (params: {
  id: string
  accessToken?: string
}) => ["google", "drive", "file", params.id, params.accessToken] as const

export const useCreateDriveFileQuery = () => {
  const getFile = useDriveFilesGet()
  const gapi = useGapi()
  const accessToken = useAccessToken()

  console.log({ accessToken })
  return useCallback(
    (
      id?: string,
    ): UseQueryOptions<
      DriveFileGetResponse,
      unknown,
      DriveFileGetResponse
    > => ({
      queryKey: getUseDriveFileQueryKey({
        id: id ?? "",
        accessToken: accessToken?.access_token ?? "",
      }),
      enabled: !!id && !!gapi,
      queryFn: async () => {
        if (!gapi) {
          throw new Error("Gapi not available")
        }

        return firstValueFrom(
          getFile(gapi, {
            fileId: id ?? "",
            fields: "id, size, name, kind, parents, mimeType, modifiedTime",
          }),
        )
      },
      retry: (_, response) => {
        if (
          !!response &&
          typeof response === "object" &&
          "status" in response &&
          response.status === 404
        ) {
          return false
        }

        return true
      },
    }),
    [getFile, gapi, accessToken],
  )
}

export const useDriveFile = ({ id }: { id?: string }) => {
  const createQuery = useCreateDriveFileQuery()

  return useQuery(createQuery(id))
}
