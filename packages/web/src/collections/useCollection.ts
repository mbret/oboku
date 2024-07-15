import { directives } from "@oboku/shared"
import { useForeverQuery, useSignalValue } from "reactjrx"
import { switchMap, map } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useLocalSettings } from "../settings/states"
import { observeEmptyCollection } from "./dbHelpers"
import { getMetadataFromCollection } from "./getMetadataFromCollection"
import { libraryStateSignal } from "../library/states"
import { COLLECTION_EMPTY_ID } from "../constants.shared"

export const useCollection = ({
  id,
  isNotInterested
}: {
  id?: string
  isNotInterested?: "with" | "none" | "only" | undefined
}) => {
  const { hideDirectivesFromCollectionName } = useLocalSettings()
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useForeverQuery({
    queryKey: [
      "rxdb",
      "collection",
      id,
      { isLibraryUnlocked, hideDirectivesFromCollectionName }
    ],
    enabled: !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => {
          if (id === COLLECTION_EMPTY_ID)
            return observeEmptyCollection({
              db,
              includeProtected: isLibraryUnlocked,
              isNotInterested
            })

          return db.obokucollection
            .findOne({
              selector: {
                _id: id
              }
            })
            .$.pipe(map((collection) => collection?.toJSON()))
        }),
        map((value) => {
          if (!value) return null

          return {
            ...value,
            displayableName: hideDirectivesFromCollectionName
              ? directives.removeDirectiveFromString(
                  getMetadataFromCollection(value).title ?? ""
                )
              : getMetadataFromCollection(value).title
          }
        })
      )
    }
  })
}
