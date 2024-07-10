import { useQuery } from "reactjrx"
import { httpClient } from "../../http/httpClient"
import { SupabaseTableSyncReportsEntries } from "@oboku/shared"
import { API_URL } from "../../constants"

export const useSyncReports = () =>
  useQuery({
    queryKey: ["api/datasourceReport"],
    queryFn: async () => {
      const response = await httpClient.fetch<SupabaseTableSyncReportsEntries>({
        url: `${API_URL}/sync/reports`,
        withAuth: true
      })

      const entries = response?.data
        .map((report) => {
          return report.report.reduce(
            (acc, { rx_model, added, deleted, updated }) => {
              const updateWith = (entry: {
                added: number
                deleted: number
                updated: number
              }) => {
                return {
                  ...entry,
                  ...(added && {
                    added: entry.added + 1
                  }),
                  ...(deleted && {
                    deleted: entry.deleted + 1
                  }),
                  ...(updated && {
                    updated: entry.updated + 1
                  })
                }
              }

              return {
                ...acc,
                [rx_model]: updateWith(acc[rx_model])
              }
            },
            {
              report,
              createdAt: new Date(report.created_at),
              endedAt: new Date(report.ended_at),
              book: {
                added: 0,
                updated: 0,
                deleted: 0
              },
              tag: {
                added: 0,
                updated: 0,
                deleted: 0
              },
              link: {
                added: 0,
                updated: 0,
                deleted: 0
              },
              obokucollection: {
                added: 0,
                updated: 0,
                deleted: 0
              }
            }
          )
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

      return entries
    },
    networkMode: "online",
    gcTime: 5 * 60 * 1000
  })
