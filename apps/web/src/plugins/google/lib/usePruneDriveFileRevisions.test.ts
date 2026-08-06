// @vitest-environment jsdom

import { renderHook } from "@testing-library/react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { usePruneDriveFileRevisions } from "./usePruneDriveFileRevisions"

function createGapiStub({
  headRevisionId,
  revisionIds,
}: {
  headRevisionId: string | undefined
  revisionIds: string[]
}) {
  const deleteRevision = vi.fn(async function deleteDriveRevision(_request: {
    fileId: string
    revisionId: string
  }) {})

  const stub = {
    client: {
      drive: {
        files: {
          get: vi.fn(async function getDriveFile() {
            return { result: { headRevisionId } }
          }),
        },
        revisions: {
          list: vi.fn(async function listDriveRevisions() {
            return {
              result: {
                revisions: revisionIds.map((id) => ({ id })),
              },
            }
          }),
          delete: deleteRevision,
        },
      },
    },
  }

  // The gapi client is a third-party global namespace with no constructible
  // stub, so tests can only provide the subset of it under test.
  return { gapi: stub as unknown as typeof gapi, deleteRevision }
}

function pruneRevisions(gapiStub: typeof gapi, fileId: string) {
  const { result } = renderHook(function renderUsePruneDriveFileRevisions() {
    return usePruneDriveFileRevisions()
  })

  return firstValueFrom(result.current(gapiStub, { fileId }))
}

describe("usePruneDriveFileRevisions", function testUsePruneDriveFileRevisions() {
  it("deletes every revision but the head one", async function deleteObsoleteRevisions() {
    const { gapi: gapiStub, deleteRevision } = createGapiStub({
      headRevisionId: "revision-3",
      revisionIds: ["revision-1", "revision-2", "revision-3"],
    })

    await pruneRevisions(gapiStub, "file-1")

    expect(deleteRevision).toHaveBeenCalledTimes(2)
    expect(deleteRevision).toHaveBeenNthCalledWith(1, {
      fileId: "file-1",
      revisionId: "revision-1",
    })
    expect(deleteRevision).toHaveBeenNthCalledWith(2, {
      fileId: "file-1",
      revisionId: "revision-2",
    })
  })

  it("leaves a file with no previous version untouched", async function keepSingleRevision() {
    const { gapi: gapiStub, deleteRevision } = createGapiStub({
      headRevisionId: "revision-1",
      revisionIds: ["revision-1"],
    })

    await pruneRevisions(gapiStub, "file-1")

    expect(deleteRevision).not.toHaveBeenCalled()
  })
})
