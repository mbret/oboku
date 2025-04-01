import { httpClientApi } from "../../http/httpClientApi.web"
import type { SyncReportPostgresEntitiesShared } from "@oboku/shared"
import { useQuery } from "@tanstack/react-query"
import { configuration } from "../../config/configuration"
export const useSyncReports = () =>
  useQuery({
    queryKey: ["api/datasourceReport"],
    queryFn: async () => {
      const { data } =
        await httpClientApi.fetch<SyncReportPostgresEntitiesShared>(
          `${configuration.API_URL}/datasources/sync-reports`,
        )

      const entries = data
        .map((report) => {
          return report.report.reduce(
            (acc, { rx_model, added, deleted, updated, fetchedMetadata }) => {
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
                [rx_model]: updateWith(acc[rx_model]),
              }
            },
            {
              report,
              createdAt: new Date(report.created_at),
              endedAt: new Date(report.ended_at),
              book: {
                added: 0,
                updated: 0,
                deleted: 0,
                fetchedMetadata: 0,
              },
              tag: {
                added: 0,
                updated: 0,
                deleted: 0,
                fetchedMetadata: 0,
              },
              link: {
                added: 0,
                updated: 0,
                deleted: 0,
                fetchedMetadata: 0,
              },
              obokucollection: {
                added: 0,
                updated: 0,
                deleted: 0,
                fetchedMetadata: 0,
              },
              datasource: {
                added: 0,
                updated: 0,
                deleted: 0,
                fetchedMetadata: 0,
              },
            },
          )
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

      return entries
    },
    networkMode: "online",
    gcTime: 5 * 60 * 1000,
  })
