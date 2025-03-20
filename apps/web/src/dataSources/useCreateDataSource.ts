import type { DataSourceDocType } from "@oboku/shared"
import { useNetworkState } from "react-use"
import { useDatabase } from "../rxdb"
import { useSynchronizeDataSource } from "./useSynchronizeDataSource"

export const useCreateDataSource = () => {
  type Payload = Omit<
    DataSourceDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const { db } = useDatabase()
  const { mutateAsync: synchronize } = useSynchronizeDataSource()
  const network = useNetworkState()

  return async (
    data: Omit<
      Payload,
      "lastSyncedAt" | "createdAt" | "modifiedAt" | "syncStatus"
    >,
  ) => {
    const dataSource = await db?.datasource.post({
      ...data,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncStatus: null,
    })

    if (dataSource && network.online) {
      await synchronize(dataSource._id)
    }
  }
}
