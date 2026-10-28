const MAX_REVISIONS_PER_REQUEST = 1000

/**
 * Drive has no way to replace a file's content without versioning it: every
 * media update becomes the head revision and the previous one is kept, still
 * counting against the user's storage quota until Drive purges it. Deleting
 * the obsolete revisions afterwards is the only strict replacement available.
 *
 * A revision never says whether it is the head one, so the id of the revision
 * to keep has to come from the update that created it.
 */
export const pruneDriveFileRevisions = async (
  _gapi: typeof gapi,
  {
    fileId,
    headRevisionId,
  }: { fileId: string; headRevisionId: string | undefined },
) => {
  const { result: revisionList } = await _gapi.client.drive.revisions.list({
    fileId,
    fields: "revisions(id)",
    pageSize: MAX_REVISIONS_PER_REQUEST,
  })

  const obsoleteRevisionIds = (revisionList.revisions ?? []).reduce<string[]>(
    function collectObsoleteRevisionId(revisionIds, { id }) {
      if (id !== undefined && id !== headRevisionId) {
        revisionIds.push(id)
      }

      return revisionIds
    },
    [],
  )

  for (const revisionId of obsoleteRevisionIds) {
    await _gapi.client.drive.revisions.delete({ fileId, revisionId })
  }
}
