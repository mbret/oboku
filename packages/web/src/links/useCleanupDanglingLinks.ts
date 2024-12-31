import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { combineLatest, first, from, of, switchMap } from "rxjs"
import { useEffect } from "react"
import { isBefore, subMonths } from "date-fns"
import { Report } from "../debug/report.shared"
import { CLEANUP_DANGLING_LINKS_INTERVAL } from "../constants.shared"
import { useMutation$ } from "reactjrx"

const useRemoveDanglingLinks = () => {
  return useMutation$({
    mutationFn: () => {
      return latestDatabase$.pipe(
        first(),
        switchMap((db) =>
          combineLatest([
            from(db.link.find().exec()),
            from(db.book.find().exec())
          ]).pipe(
            switchMap(([links, books]) => {
              const danglingLinks = links.filter((link) => {
                const noExistingBook = !books.some((book) =>
                  book.links.includes(link._id)
                )

                return noExistingBook
              })

              const today = new Date()
              const aMonthAgo = subMonths(today, 1)

              const danglingLinksOlderThanMonth = danglingLinks.filter(
                (link) => {
                  const date = new Date(link.createdAt)

                  return isBefore(date, aMonthAgo)
                }
              )

              Report.warn(
                `Cleaning up dangling links. Found ${danglingLinks.length} dangling links and ${danglingLinksOlderThanMonth.length} older than a month to be deleted.`
              )

              if (danglingLinksOlderThanMonth.length > 0) {
                return db.link.bulkRemove(
                  danglingLinksOlderThanMonth.map((link) => link._id)
                )
              }

              return of(null)
            })
          )
        )
      )
    }
  })
}

export const useCleanupDanglingLinks = () => {
  const { mutate: removeDanglingLinks } = useRemoveDanglingLinks()

  useEffect(() => {
    const timer = setInterval(
      removeDanglingLinks,
      CLEANUP_DANGLING_LINKS_INTERVAL
    )

    return () => {
      clearInterval(timer)
    }
  }, [removeDanglingLinks])
}
