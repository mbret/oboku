import { plugins } from "../plugins/configure"
import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"
import type { Database } from "../rxdb"
import { isRemovableFromDataSource } from "./isRemovableFromDataSource"

export const useLinks = () => {
  return useQuery$({
    queryKey: ["rxdb", "get", "many", "link/list"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.link.find({}).$),
        map((entries) => entries.map((item) => item.toJSON())),
      )
    },
  })
}

export const useLink = ({ id }: { id?: string }) => {
  return useQuery$({
    queryKey: ["rxdb", "get", "single", "link", id],
    enabled: !!id,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap(
          (db) =>
            db.collections.link.findOne({
              selector: {
                _id: id,
              },
            }).$,
        ),
        map((entry) => entry?.toJSON() ?? null),
      ),
  })
}

export const getLinkStateAsync = async ({
  db,
  linkId,
}: {
  linkId: string
  db: Database
}) => {
  const link = await db.link
    .findOne({
      selector: {
        _id: linkId,
      },
    })
    .exec()

  const jsonLink = link?.toJSON()

  if (!jsonLink) return undefined

  const linkPlugin = plugins.find((plugin) => plugin.type === jsonLink.type)

  return {
    ...jsonLink,
    isSynchronizable: !!linkPlugin?.canSynchronize,
    isRemovableFromDataSource: isRemovableFromDataSource({ link: jsonLink }),
  }
}
