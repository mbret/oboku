import { atomicUpdate } from "@libs/couch/dbHelpers"
import type { CollectionDocType } from "@oboku/shared/src/db/docTypes"
import type nano from "nano"
import { from } from "rxjs"

export const markCollectionAsFetching = ({
  db,
  collectionId,
}: {
  db: nano.DocumentScope<unknown>
  collectionId: string
}) =>
  from(
    atomicUpdate(db, "obokucollection", collectionId, (old) => {
      const wasAlreadyInitialized =
        old.metadataUpdateStatus === "fetching" && old.lastMetadataStartedAt

      if (wasAlreadyInitialized) return old

      return {
        ...old,
        metadataUpdateStatus: "fetching" as const,
        lastMetadataStartedAt: new Date().toISOString(),
      }
    }),
  )

export const markCollectionAsError = ({
  db,
  collectionId,
}: {
  db: nano.DocumentScope<unknown>
  collectionId: string
}) =>
  from(
    atomicUpdate(
      db,
      "obokucollection",
      collectionId,
      (old) =>
        ({
          ...old,
          metadataUpdateStatus: "idle",
          lastMetadataUpdateError: "unknown",
        }) satisfies CollectionDocType,
    ),
  )
