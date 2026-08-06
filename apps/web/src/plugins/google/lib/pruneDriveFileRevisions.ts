import { isDefined } from "reactjrx"

const MAX_REVISIONS_PER_REQUEST = 1000

/**
 * Drive has no way to replace a file's content without versioning it: every
 * media update becomes the head revision and the previous one is kept, still
 * counting against the user's storage quota until Drive purges it. Deleting
 * the obsolete revisions afterwards is the only strict replacement available.
 */
export const pruneDriveFileRevisions = async (
  _gapi: typeof gapi,
  { fileId }: { fileId: string },
) => {
  const { result: file } = await _gapi.client.drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "headRevisionId",
  })

  const { result: revisionList } = await _gapi.client.drive.revisions.list({
    fileId,
    fields: "revisions(id)",
    pageSize: MAX_REVISIONS_PER_REQUEST,
  })

  const obsoleteRevisionIds = (revisionList.revisions ?? [])
    .map((revision) => revision.id)
    .filter(isDefined)
    .filter((revisionId) => revisionId !== file.headRevisionId)

  for (const revisionId of obsoleteRevisionIds) {
    await _gapi.client.drive.revisions.delete({ fileId, revisionId })
  }
}
