import { LinkDocType } from "@oboku/shared"
import { plugins } from "../plugins/configure"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { isRemovableFromDataSource } from "./isRemovableFromDataSource"

export const getLinksByIds = async (database: Database) => {
  const result = await database.collections.link.find({}).exec()

  return keyBy(result, "_id")
}

export const useLinks = () => {
  return useQuery({
    queryKey: ["db", "get", "many", "link"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.link.find({}).$),
        map((entries) => keyBy(entries, "_id"))
      )
    },
    staleTime: Infinity
  })
}

export const useLink = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["db", "get", "single", "link", id],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap(
          (db) =>
            db.collections.link.findOne({
              selector: {
                _id: id
              }
            }).$
        ),
        map((entry) => entry?.toJSON())
      ),
    staleTime: Infinity
  })
}

const mapLinkTtoState = ({ link }: { link?: LinkDocType | null }) => {
  if (!link) return undefined

  const linkPlugin = plugins.find((plugin) => plugin.type === link.type)

  return {
    ...link,
    isSynchronizable: !!linkPlugin?.canSynchronize,
    isRemovableFromDataSource: isRemovableFromDataSource({ link })
  }
}

export const getLinkState = (
  linksState: ReturnType<typeof useLinks>["data"] = {},
  linkId: string
) => {
  const link = Object.values(linksState).find((link) => link?._id === linkId)

  return mapLinkTtoState({ link: link?.toJSON() })
}

export const getLinkStateAsync = async ({
  db,
  linkId
}: {
  linkId: string
  db: Database
}) => {
  const link = await db.link
    .findOne({
      selector: {
        _id: linkId
      }
    })
    .exec()

  return mapLinkTtoState({ link: link?.toJSON() })
}

/**
 * @todo optimize to refresh only when link id change
 */
export const useLinkState = (linkId: string) => {
  const { data: links = {} } = useLinks()

  const link = Object.values(links).find((link) => link?._id === linkId)

  return mapLinkTtoState({
    link: link?.toJSON()
  })
}
