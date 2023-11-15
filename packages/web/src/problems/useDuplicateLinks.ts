import { groupBy } from "lodash"
import { useMemo } from "react"
import { useSubscribe$ } from "../common/rxjs/useSubscribe$"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"

export const useDuplicatedResourceIdLinks = () => {
  const { db: database } = useDatabase()

  const { data: links = [] } = useSubscribe$(
    useMemo(() => database?.link.find().$, [database])
  )

  return useMemo(() => {
    const dataByResourceId = groupBy(links, "resourceId")
    const duplicatedDocuments = Object.keys(dataByResourceId)
      .filter((resourceId) => (dataByResourceId[resourceId]?.length ?? 0) > 1)
      .map((resourceId) => [
        resourceId,
        {
          name: (dataByResourceId[resourceId] ?? [])[0]?.resourceId,
          number: dataByResourceId[resourceId]?.length ?? 0
        }
      ])

    Report.log(
      `Found ${duplicatedDocuments.length} duplicated link resourceIds`,
      duplicatedDocuments
    )

    return duplicatedDocuments as [string, { name: string; number: number }][]
  }, [links])
}
