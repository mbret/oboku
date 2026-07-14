import {
  compareDesc,
  type SyncReportPostgresEntitiesShared,
} from "@oboku/shared"
import { useQuery } from "@tanstack/react-query"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useQueryOptionsWithAuthentication } from "../../auth"

const emptyCounts = () => ({
  added: 0,
  deleted: 0,
  updated: 0,
  fetchedMetadata: 0,
})

export const useSyncReports = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: ["api/datasourceReport"],
      queryFn: async () => {
        const { data } =
          await httpClientApi.fetchOrThrow<SyncReportPostgresEntitiesShared>(
            `${config?.API_URL}/datasources/sync-reports`,
          )

        const entries = data
          .map((report) => {
            return report.report.reduce(
              (acc, { rx_model, added, deleted, updated, fetchedMetadata }) => {
                const current = acc[rx_model] ?? emptyCounts()

                const updateWith = (entry: {
                  added: number
                  deleted: number
                  updated: number
                  fetchedMetadata: number
                }) => {
                  return {
                    ...(fetchedMetadata && {
                      fetchedMetadata: entry.fetchedMetadata + 1,
                    }),
                    ...(added && {
                      added: entry.added + 1,
                    }),
                    ...(deleted && {
                      deleted: entry.deleted + 1,
                    }),
                    ...(updated && {
                      updated: entry.updated + 1,
                    }),
                  }
                }

                return {
                  ...acc,
                  [rx_model]: {
                    ...current,
                    ...updateWith(current),
                  },
                }
              },
              {
                report,
                createdAt: new Date(report.created_at),
                endedAt: new Date(report.ended_at),
                book: emptyCounts(),
                tag: emptyCounts(),
                link: emptyCounts(),
                obokucollection: emptyCounts(),
                datasource: emptyCounts(),
              },
            )
          })
          .sort((a, b) => compareDesc(a.createdAt, b.createdAt))

        return entries
      },
      gcTime: 5 * 60 * 1000,
    }),
  )
}
