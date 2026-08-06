import { useCallback } from "react"
import { concatMap, from, map, switchMap, toArray } from "rxjs"
import { isDefined } from "reactjrx"
import { useDriveFilesGet } from "../../../google/useDriveFilesGet"

const MAX_REVISIONS_PER_REQUEST = 1000

/**
 * Drive has no way to replace a file's content without versioning it: every
 * media update becomes the head revision and the previous one is kept, still
 * counting against the user's storage quota until Drive purges it. Deleting
 * the obsolete revisions afterwards is the only strict replacement available.
 */
export const usePruneDriveFileRevisions = () => {
  const getDriveFile = useDriveFilesGet()

  return useCallback(
    (_gapi: typeof gapi, { fileId }: { fileId: string }) =>
      getDriveFile(_gapi, {
        fileId,
        supportsAllDrives: true,
        fields: "headRevisionId",
      }).pipe(
        switchMap(function listObsoleteRevisions({
          result: { headRevisionId },
        }) {
          return from(
            _gapi.client.drive.revisions.list({
              fileId,
              fields: "revisions(id)",
              pageSize: MAX_REVISIONS_PER_REQUEST,
            }),
          ).pipe(
            map(function toObsoleteRevisionIds({ result }) {
              return (result.revisions ?? [])
                .map((revision) => revision.id)
                .filter(isDefined)
                .filter((revisionId) => revisionId !== headRevisionId)
            }),
          )
        }),
        switchMap(function deleteObsoleteRevisions(obsoleteRevisionIds) {
          return from(obsoleteRevisionIds).pipe(
            concatMap(function deleteRevision(revisionId) {
              return from(
                _gapi.client.drive.revisions.delete({ fileId, revisionId }),
              )
            }),
            toArray(),
          )
        }),
      ),
    [getDriveFile],
  )
}
