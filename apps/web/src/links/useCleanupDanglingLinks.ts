import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { combineLatest, first, from, of, switchMap } from "rxjs"
import { useEffect } from "react"
import { Logger } from "../debug/logger.shared"
import { useMutation$ } from "reactjrx"
import { useConfig } from "../config/useConfig"

const useRemoveDanglingLinks = () => {
  return useMutation$({
    mutationFn: () => {
      return latestDatabase$.pipe(
        first(),
        switchMap((db) =>
          combineLatest([
            from(db.link.find().exec()),
            from(db.book.find().exec()),
          ]).pipe(
            switchMap(([links, books]) => {
              const danglingLinks = links.filter((link) => {
                const noExistingBook = !books.some((book) =>
                  book.links.includes(link._id),
                )

                return noExistingBook
              })

              const today = new Date()
              const aMonthAgo = new Date(today)
              aMonthAgo.setMonth(aMonthAgo.getMonth() - 1)

              const danglingLinksOlderThanMonth = danglingLinks.filter(
                (link) => {
                  const date = new Date(link.createdAt)

                  return date < aMonthAgo
                },
              )

              Logger.warn(
                `Cleaning up dangling links. Found ${danglingLinks.length} dangling links and ${danglingLinksOlderThanMonth.length} older than a month to be deleted.`,
              )

              if (danglingLinksOlderThanMonth.length > 0) {
                return db.link.bulkRemove(
                  danglingLinksOlderThanMonth.map((link) => link._id),
                )
              }

              return of(null)
            }),
          ),
        ),
      )
    },
  })
}

export const useCleanupDanglingLinks = () => {
  const { data: config } = useConfig()
  const cleanupInterval = config?.CLEANUP_DANGLING_LINKS_INTERVAL
  const { mutate: removeDanglingLinks } = useRemoveDanglingLinks()

  useEffect(() => {
    if (!cleanupInterval) return

    const timer = setInterval(removeDanglingLinks, cleanupInterval)

    return () => {
      clearInterval(timer)
    }
  }, [removeDanglingLinks, cleanupInterval])
}
