import { useMemo } from "react"
import { useBooks } from "../books/states"
import { difference } from "@oboku/shared"
import { useLinks } from "../links/states"

export const useFixableLinks = () => {
  const { data: unsafeBooks } = useBooks({ includeProtected: true })
  const { data: links } = useLinks()

  const linkIds = useMemo(() => links?.map((item) => item._id), [links])

  const allLinksUsed =
    unsafeBooks?.reduce(
      (acc, book) => [...acc, ...book.links],
      [] as string[]
    ) ?? []

  const danglingLinks = difference(linkIds, allLinksUsed)

  return { danglingLinks }
}
