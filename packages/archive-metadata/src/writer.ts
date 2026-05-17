import type { ArchiveSource } from "./archive/types"
import { COMIC_INFO_FILENAME, buildPatchedComicInfoXml } from "./comicInfo"
import { findOpfEntry } from "./opf/read"
import { buildPatchedOpfXml } from "./opf/write"

/**
 * Fields an archive patch may set. Mirrors the writable subset of
 * {@link ArchiveMetadata} — expand in lockstep when a new field
 * becomes writable in at least one container.
 *
 * Today only `isbn` is writable.
 */
export type ArchiveMetadataPatch = {
  isbn?: string | undefined
}

/**
 * Output containers the caller wants the patch written into. Set a
 * flag to `true` to opt that container in. The package never picks
 * targets on its own: deciding *where* metadata should live for a
 * given archive is product policy (and may diverge per reader app),
 * so it stays with the consumer.
 *
 * Consumers may call the writer once per container when each target
 * needs different values.
 */
export type ArchiveMetadataTargets = {
  comicInfo?: boolean
  opf?: boolean
}

/**
 * Describes one entry the caller should write back into the archive
 * to realize the patch. Each entry's `path` is archive-relative and
 * uses forward slashes; `xml` is a UTF-8 string ready to be stored.
 *
 * We emit a list — rather than a single path + body — so multi-target
 * patches (e.g. ComicInfo + OPF for hybrid archives) drop into the
 * same shape as single-target ones.
 */
export type ArchivePatchedEntry = {
  path: string
  xml: string
}

export type ArchivePatch = {
  entries: ArchivePatchedEntry[]
}

/**
 * Apply a metadata patch to an archive and return the XML bodies that
 * the caller should write back. The `targets` argument is required:
 * the package no longer picks where to write based on what's in the
 * archive — that decision belongs to the consumer.
 *
 * Per-target rules:
 *  - `targets.comicInfo` → patch the existing `ComicInfo.xml` if any,
 *    otherwise synthesize a minimal one. This always succeeds and is
 *    the safe default for archives that carry no embedded metadata.
 *  - `targets.opf` → patch the existing OPF package document. Throws
 *    when the archive has no OPF: synthesizing one would turn a CBZ
 *    into an EPUB, which is well outside this writer's scope.
 *
 * Calling with no targets selected is a programming error — the
 * caller's policy should always pick at least one container.
 *
 * The caller keeps ownership of how the archive is repacked — each
 * runtime plugs in its own write-capable zip library (JSZip on the
 * web; something else on the server when that lands). Keeping the
 * writer at the XML layer is the same layering choice that
 * {@link readArchiveMetadata} makes for reads.
 */
export const patchArchiveMetadata = async (
  source: ArchiveSource,
  patch: ArchiveMetadataPatch,
  targets: ArchiveMetadataTargets,
): Promise<ArchivePatch> => {
  if (!targets.comicInfo && !targets.opf) {
    throw new Error(
      "patchArchiveMetadata requires at least one target (comicInfo or opf).",
    )
  }

  const entries: ArchivePatchedEntry[] = []

  if (targets.comicInfo) {
    const xml = await buildPatchedComicInfoXml(source, { isbn: patch.isbn })
    entries.push({ path: COMIC_INFO_FILENAME, xml })
  }

  if (targets.opf) {
    const opfEntry = await findOpfEntry(source)

    if (!opfEntry) {
      throw new Error(
        "Cannot write OPF metadata: archive does not carry an OPF package document.",
      )
    }

    const xml = await buildPatchedOpfXml(opfEntry, { isbn: patch.isbn })
    entries.push({ path: opfEntry.path, xml })
  }

  return { entries }
}
