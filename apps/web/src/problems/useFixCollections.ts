import type { CollectionDocType } from "@oboku/shared"
import { useCallback } from "react"
import type { DeepMutable } from "rxdb/dist/types/types"
import { Logger } from "../debug/logger.shared"
import { useDatabase } from "../rxdb"

export const useFixCollections = () => {
  const { db: database } = useDatabase()

  return useCallback(
    async (data: [string, { name: string; number: number }][]) => {
      const yes = window.confirm(
        `
            This action will merge collections that use the same resources.
            We will try to use a non destructive merge by keeping defined properties when possible. 
            You may want to re-sync after the operation to restore value with their latest state.
            `.replace(/ {2,}/g, ""),
      )

      if (yes && database) {
        try {
          await Promise.all(
            data.map(async ([key]) => {
              const { linkType, linkData } = JSON.parse(key)

              const selector = {
                linkType,
                linkData,
              }
              const duplicateDocs = await database?.obokucollection
                .find({ selector })
                .exec()

              const collectionsAsJson = duplicateDocs.map(
                (document) =>
                  document.toJSON() as DeepMutable<CollectionDocType>,
              )

              const mergedDoc = collectionsAsJson?.reduce(
                (previous, current) => {
                  if (!previous) return current

                  const mutatedPrevious = { ...previous }

                  // we use || to be as less destructive as possible
                  return { ...mutatedPrevious, ...current }
                },
                collectionsAsJson[0],
              )

              if (!mergedDoc) return

              const { _id, _rev, ...safeMergedDoc } = mergedDoc

              // we update the first entry with the all merged data
              await duplicateDocs[0]?.incrementalModify((oldData) => ({
                ...oldData,
                ...safeMergedDoc,
              }))

              // then we remove all the other documents
              await Promise.all(
                duplicateDocs
                  .slice(1)
                  .map(async (document) => document.remove()),
              )
            }),
          )
        } catch (e) {
          Logger.error(e)
        }
      }
    },
    [database],
  )
}
