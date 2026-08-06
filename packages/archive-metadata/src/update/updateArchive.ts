import { isArchiveEpub } from "@prose-reader/archive-reader"
import type { ImageCompressionResult } from "../images/types"
import type { Archive } from "../archive/types"
import { patchArchiveMetadata } from "../metadata/write"
import {
  type EditableArchive,
  toArchive,
  toEditableArchive,
} from "./editableArchive"
import type { CompressImagesAction, PatchMetadataAction } from "./actions"
import type { OpenStagingScope, StageBytes } from "./staging"
import { writeZip } from "./writeZip"

const EPUB_MIME_TYPE = "application/epub+zip"
const CBZ_MIME_TYPE = "application/x-cbz"
const ZIP_MIME_TYPE = "application/zip"
const MIMETYPE_ENTRY = "mimetype"

export type ArchiveUpdateProgress =
  | {
      phase: "compress-images"
      completed: number
      total: number
    }
  | { phase: "write-archive" }

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
   * MIME type reported for the source container. The source filename and
   * detected EPUB structure take precedence over a generic ZIP type.
   */
  sourceMimeType?: string
  onProgress?: (progress: ArchiveUpdateProgress) => void
}

/**
 * Runtime-specific capabilities the pipeline needs. Each entrypoint supplies
 * its own, which is what keeps the action union honest: a runtime without
 * `compressImages` cannot accept a `compress-images` action.
 */
export type ArchiveUpdateRuntime = {
  openStagingScope: OpenStagingScope
  compressImages:
    | ((
        entries: EditableArchive,
        action: CompressImagesAction,
        context: {
          stageBytes: StageBytes
          onProgress: (completed: number, total: number) => void
        },
      ) => Promise<ImageCompressionResult>)
    | undefined
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

const resolveFilenameMimeType = (filename: string | undefined) => {
  const normalizedFilename = filename?.toLowerCase()

  if (normalizedFilename?.endsWith(".epub")) return EPUB_MIME_TYPE
  if (normalizedFilename?.endsWith(".cbz")) return CBZ_MIME_TYPE
  if (normalizedFilename?.endsWith(".zip")) return ZIP_MIME_TYPE

  return undefined
}

const resolveOutputMimeType = (
  sourceFilename: string | undefined,
  sourceMimeType: string | undefined,
  { isEpub }: { isEpub: boolean },
): string => {
  const filenameMimeType = resolveFilenameMimeType(sourceFilename)

  if (filenameMimeType) return filenameMimeType
  if (isEpub) return EPUB_MIME_TYPE
  if (sourceMimeType) return sourceMimeType

  return ZIP_MIME_TYPE
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
export const runArchiveUpdate = async <
  Action extends PatchMetadataAction | CompressImagesAction,
>(
  runtime: ArchiveUpdateRuntime,
  archive: Archive,
  { actions, sourceMimeType, onProgress }: ArchiveUpdateOptions<Action>,
): Promise<ArchiveUpdateResult> => {
  const entries = toEditableArchive(archive)
  const scope = await runtime.openStagingScope()

  try {
    for (const action of actions) {
      if (action.kind === "patch-metadata") {
        await applyMetadataPatch(entries, action)
        continue
      }

      if (!runtime.compressImages) {
        throw new Error(
          `This runtime cannot run the "${action.kind}" action: no image compression available.`,
        )
      }

      await runtime.compressImages(entries, action, {
        stageBytes: scope.stageBytes,
        onProgress: function reportImageCompressionProgress(completed, total) {
          onProgress?.({ phase: action.kind, completed, total })
        },
      })
    }

    const isEpub = isArchiveEpub(toArchive(entries))
    const outputEntries = isEpub ? enforceEpubMimetypeFirst(entries) : entries

    onProgress?.({ phase: "write-archive" })

    const { blob, dispose: disposeZipTarget } = await writeZip(outputEntries, {
      openZipTarget: scope.openZipTarget,
    })

    return {
      blob,
      mimeType: resolveOutputMimeType(
        archive.filename,
        sourceMimeType || archive.encodingFormat,
        { isEpub },
      ),
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
