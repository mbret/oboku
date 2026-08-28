import {
  type ArchiveMetadataTargets,
  isComicInfoWritableIdentifierScheme,
} from "@oboku/archive-metadata/web"
import { isIsbnBearingScheme } from "@prose-reader/archive-reader"
import type { FileInspection } from "../../useFileInspection"

type ContainerKey = "comicInfo" | "opf"

export const CONTAINER_LABELS: Record<ContainerKey, string> = {
  comicInfo: "ComicInfo.xml",
  opf: "OPF package document",
}

/**
 * An unreadable OPF is skipped rather than replaced: the package document also
 * carries the manifest and spine, so overwriting it with the fields oboku
 * knows about would cost the book its reading order. ComicInfo is always a
 * target — it is patched when present and synthesized when not.
 */
export const resolveMetadataTargets = ({
  resolvedArchive,
}: FileInspection): ArchiveMetadataTargets => {
  const { sources, unreadableSources } = resolvedArchive

  if (
    unreadableSources.includes("opf") ||
    unreadableSources.includes("comicInfo")
  ) {
    return { comicInfo: false, opf: false }
  }

  const opf = sources.opf !== undefined

  return { comicInfo: sources.comicInfo !== undefined || !opf, opf }
}

/** Whether a save has any container left to write the identifiers into. */
export const hasWritableMetadataTarget = (
  inspection: FileInspection,
): boolean => {
  const { comicInfo, opf } = resolveMetadataTargets(inspection)

  return comicInfo === true || opf === true
}

/**
 * The containers each identifier can actually be stored in, which is neither
 * the same set for every scheme nor decidable one identifier at a time:
 * ComicInfo takes ISBN/GTIN, links, and the catalogs that have a link form,
 * but `<GTIN>` is a single field — so a second ISBN needs an OPF, while a
 * second link does not. Returned positionally, one entry per identifier.
 */
export const identifierDestinations = (
  identifiers: ReadonlyArray<{ scheme: string }>,
  targets: ArchiveMetadataTargets,
): ContainerKey[][] => {
  let gtinFieldTaken = false

  return identifiers.map(function destinationsFor({ scheme }) {
    const containers: ContainerKey[] = []
    const needsGtinField = isIsbnBearingScheme(scheme)

    if (
      targets.comicInfo &&
      isComicInfoWritableIdentifierScheme(scheme) &&
      !(needsGtinField && gtinFieldTaken)
    ) {
      containers.push("comicInfo")
      gtinFieldTaken = gtinFieldTaken || needsGtinField
    }

    if (targets.opf) containers.push("opf")

    return containers
  })
}
