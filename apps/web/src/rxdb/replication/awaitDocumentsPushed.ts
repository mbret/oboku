import type { RxDocument } from "rxdb"
import { defer, firstValueFrom, forkJoin, timeout } from "rxjs"
import { runningReplicationsSignal } from "./states"

export const DOCUMENTS_PUSH_TIMEOUT_MS = 10_000

/**
 * A document of any collection. RxDB types a document's collection
 * invariantly, so the documents of several collections share no narrower type.
 */
export type PushableDocument = RxDocument<any>

/**
 * Resolves once each document, in the state given or a later one, has
 * reached oboku's server through its collection's replication.
 *
 * @throws when a document's collection has no running replication (offline,
 * signed out), or when the documents are not all pushed within
 * `DOCUMENTS_PUSH_TIMEOUT_MS`.
 */
export const awaitDocumentsPushed = async (
  documents: ReadonlyArray<PushableDocument>,
) => {
  const runningReplications = runningReplicationsSignal.getValue()
  const pushes = documents.map(function toPush(document) {
    const replication = runningReplications.get(document.collection.name)

    if (!replication) {
      throw new Error(
        `No replication of the ${document.collection.name} collection runs`,
      )
    }

    return defer(function awaitDocumentPushed() {
      return replication.awaitDocumentPushed(document)
    })
  })

  await firstValueFrom(
    forkJoin(pushes).pipe(timeout(DOCUMENTS_PUSH_TIMEOUT_MS)),
    { defaultValue: [] },
  )
}
