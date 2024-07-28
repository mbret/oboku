import { LinkDocType } from "@oboku/shared"
import { plugins } from "../plugins/configure"
import { useForeverQuery } from "reactjrx"
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
  return useForeverQuery({
    queryKey: ["rxdb", "get", "many", "links/list"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.link.find({}).$),
        map((entries) => entries.map((item) => item.toJSON()))
      )
    }
  })
}

export const useLinksDic = () => {
  return useForeverQuery({
    queryKey: ["rxdb", "get", "many", "links/dic"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.link.find({}).$),
        map((entries) => keyBy(entries, "_id"))
      )
    }
  })
}

export const useLink = ({ id }: { id?: string }) => {
  return useForeverQuery({
    queryKey: ["rxdb", "get", "single", "link", id],
    enabled: !!id,
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
      )
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
  linksState: ReturnType<typeof useLinksDic>["data"] = {},
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
  const { data: links = {} } = useLinksDic()

  const link = Object.values(links).find((link) => link?._id === linkId)

  return mapLinkTtoState({
    link: link?.toJSON()
  })
}
