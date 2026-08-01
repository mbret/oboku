import type { Archive } from "../archive/types"
import { patchArchiveMetadata } from "../writer"
import {
  type EditableArchive,
  toArchive,
  toEditableArchive,
} from "./editableArchive"
import type { PatchMetadataAction } from "./actions"
import type { OpenStagingScope } from "./staging"
import { writeZip } from "./writeZip"

const EPUB_MIME_TYPE = "application/epub+zip"
const CBZ_MIME_TYPE = "application/x-cbz"
const MIMETYPE_ENTRY = "mimetype"

export type ArchiveUpdateResult = {
  blob: Blob
  mimeType: string
  /**
   * Releases whatever the update staged to produce `blob`. `blob` may only
   * reference its staged bytes rather than hold them, so it has to be fully read
   * before this is called.
   */
  dispose: () => Promise<void>
}

export type ArchiveUpdateOptions<Action> = {
  actions: Action[]
  /**
   * MIME type of the source container, kept when it is known. Archives read
   * from an opaque source often have none, and the type is then derived from
   * what the output actually contains.
   */
  sourceMimeType?: string
}

/**
 * Runtime-specific capabilities the pipeline needs. Each entrypoint supplies its
 * own, which is what lets a runtime without a filesystem assemble the output in
 * memory while one with OPFS spills it to disk.
 */
export type ArchiveUpdateRuntime = {
  openStagingScope: OpenStagingScope
}

const applyMetadataPatch = async (
  entries: EditableArchive,
  { patch, targets }: PatchMetadataAction,
): Promise<void> => {
  const { entries: patched } = await patchArchiveMetadata(
    toArchive(entries),
    patch,
    targets,
  )

  for (const entry of patched) {
    entries.set(entry.path, { dir: false, content: entry.xml })
  }
}

const archiveHasOpf = (paths: string[]): boolean =>
  paths.some((path) => path.toLowerCase().endsWith(".opf"))

const resolveOutputMimeType = (
  sourceMimeType: string | undefined,
  { hasOpf }: { hasOpf: boolean },
): string => {
  if (sourceMimeType) return sourceMimeType

  return hasOpf ? EPUB_MIME_TYPE : CBZ_MIME_TYPE
}

/**
 * EPUB OCF requires the `mimetype` entry to be the archive's first record and
 * stored uncompressed. We rewrite it as a STORED entry and move it to the front
 * (write order follows insertion order) so the output stays valid for strict
 * readers.
 */
const enforceEpubMimetypeFirst = (
  entries: EditableArchive,
): EditableArchive => {
  const reordered: EditableArchive = new Map()

  reordered.set(MIMETYPE_ENTRY, {
    dir: false,
    content: EPUB_MIME_TYPE,
    store: true,
  })

  for (const [path, entry] of entries) {
    if (path !== MIMETYPE_ENTRY) reordered.set(path, entry)
  }

  return reordered
}

/**
 * Applies `actions` to a copy of the archive's entries and writes the result
 * back out as a new container. The source archive is only read from — the
 * caller keeps ownership of it (and of closing it).
 */
export const runArchiveUpdate = async <Action extends PatchMetadataAction>(
  runtime: ArchiveUpdateRuntime,
  archive: Archive,
  { actions, sourceMimeType }: ArchiveUpdateOptions<Action>,
): Promise<ArchiveUpdateResult> => {
  const entries = toEditableArchive(archive)
  const scope = await runtime.openStagingScope()

  try {
    for (const action of actions) {
      await applyMetadataPatch(entries, action)
    }

    const hasOpf = archiveHasOpf([...entries.keys()])
    const outputEntries = hasOpf ? enforceEpubMimetypeFirst(entries) : entries
    const { blob, dispose: disposeZipTarget } = await writeZip(outputEntries, {
      openZipTarget: scope.openZipTarget,
    })

    return {
      blob,
      mimeType: resolveOutputMimeType(sourceMimeType, { hasOpf }),
      dispose: async function releaseStagingScope() {
        await disposeZipTarget()
        await scope.release()
      },
    }
  } catch (error) {
    await scope.release()

    throw error
  }
}
