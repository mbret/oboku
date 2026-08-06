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
  const [{ result: file }, { result: revisionList }] = await Promise.all([
    _gapi.client.drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "headRevisionId",
    }),
    _gapi.client.drive.revisions.list({
      fileId,
      fields: "revisions(id)",
      pageSize: MAX_REVISIONS_PER_REQUEST,
    }),
  ])

  const obsoleteRevisionIds = (revisionList.revisions ?? []).reduce<string[]>(
    function collectObsoleteRevisionId(revisionIds, { id }) {
      if (id !== undefined && id !== file.headRevisionId) {
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
