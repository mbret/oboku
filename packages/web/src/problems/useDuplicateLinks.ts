import { useMemo } from "react"
import { Report } from "../debug/report.shared"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { switchMap } from "rxjs"
import { useObserve } from "reactjrx"
import { groupBy } from "@oboku/shared"

export const useDuplicatedResourceIdLinks = () => {
  const links = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db?.link.find().$)),
    []
  )

  return useMemo(() => {
    const dataByResourceId = groupBy(links, "resourceId")
    const duplicatedDocuments = Object.keys(dataByResourceId)
      .filter((resourceId) => dataByResourceId[resourceId]!.length > 1)
      .map((resourceId) => [
        resourceId,
        {
          name: dataByResourceId[resourceId]![0]?.resourceId,
          number: dataByResourceId[resourceId]!.length
        }
      ])

    Report.log(
      `Found ${duplicatedDocuments.length} duplicated link resourceIds`,
      duplicatedDocuments
    )

    return duplicatedDocuments as [string, { name: string; number: number }][]
  }, [links])
}
