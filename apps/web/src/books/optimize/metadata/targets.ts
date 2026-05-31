import type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
} from "@oboku/archive-metadata"
import type { FileInspection } from "../useFileInspection"
import type { MetadataFixerFormValues } from "./types"

type ContainerKey = "comicInfo" | "opf"
type FieldName = keyof MetadataFixerFormValues

export type DetectedContainer = {
  key: ContainerKey
  label: string
}

export type MetadataFormSection = {
  key: ContainerKey
  label: string
  fieldName: FieldName
  isbn: string | undefined
}

export type ArchiveMetadataPatchPlan = {
  patch: ArchiveMetadataPatch
  targets: ArchiveMetadataTargets
}

const CONTAINER_LABELS: Record<ContainerKey, string> = {
  comicInfo: "ComicInfo.xml",
  opf: "OPF package document",
}

const CONTAINER_ORDER: readonly ContainerKey[] = ["comicInfo", "opf"]

export const EMPTY_METADATA_FIXER_FORM_VALUES: MetadataFixerFormValues = {
  comicInfoIsbn: "",
  opfIsbn: "",
}

const normalizeFormIsbn = (isbn: string): string | undefined => {
  const trimmed = isbn.trim()

  return trimmed === "" ? undefined : trimmed
}

export const trimMetadataFixerFormValues = ({
  comicInfoIsbn,
  opfIsbn,
}: MetadataFixerFormValues): MetadataFixerFormValues => ({
  comicInfoIsbn: comicInfoIsbn.trim(),
  opfIsbn: opfIsbn.trim(),
})

export const resolveMetadataFixerFormValues = (
  inspection: FileInspection | undefined,
): MetadataFixerFormValues => {
  if (!inspection) return EMPTY_METADATA_FIXER_FORM_VALUES

  return {
    comicInfoIsbn: inspection.comicInfoIsbn ?? "",
    opfIsbn: inspection.opfIsbn ?? "",
  }
}

export const collectDetectedContainers = ({
  hasOpf,
  hasComicInfo,
}: {
  hasOpf: boolean
  hasComicInfo: boolean
}): DetectedContainer[] => {
  const present: Record<ContainerKey, boolean> = {
    comicInfo: hasComicInfo,
    opf: hasOpf,
  }

  return CONTAINER_ORDER.filter((key) => present[key]).map((key) => ({
    key,
    label: CONTAINER_LABELS[key],
  }))
}

export const resolveMetadataFormSections = (
  inspection: FileInspection | undefined,
): MetadataFormSection[] => {
  if (!inspection) return []

  if (!inspection.hasComicInfo && !inspection.hasOpf) {
    return [
      {
        key: "comicInfo",
        label: CONTAINER_LABELS.comicInfo,
        fieldName: "comicInfoIsbn",
        isbn: undefined,
      },
    ]
  }

  const sections: MetadataFormSection[] = []

  if (inspection.hasComicInfo) {
    sections.push({
      key: "comicInfo",
      label: CONTAINER_LABELS.comicInfo,
      fieldName: "comicInfoIsbn",
      isbn: inspection.comicInfoIsbn,
    })
  }

  if (inspection.hasOpf) {
    sections.push({
      key: "opf",
      label: CONTAINER_LABELS.opf,
      fieldName: "opfIsbn",
      isbn: inspection.opfIsbn,
    })
  }

  return sections
}

export const resolveArchiveMetadataPatchPlans = (
  values: MetadataFixerFormValues,
  inspection: FileInspection | undefined,
): ArchiveMetadataPatchPlan[] => {
  if (!inspection) return []

  if (!inspection.hasComicInfo && !inspection.hasOpf) {
    return [
      {
        patch: { isbn: normalizeFormIsbn(values.comicInfoIsbn) },
        targets: { comicInfo: true },
      },
    ]
  }

  const patches: ArchiveMetadataPatchPlan[] = []

  if (inspection.hasComicInfo) {
    patches.push({
      patch: { isbn: normalizeFormIsbn(values.comicInfoIsbn) },
      targets: { comicInfo: true },
    })
  }

  if (inspection.hasOpf) {
    patches.push({
      patch: { isbn: normalizeFormIsbn(values.opfIsbn) },
      targets: { opf: true },
    })
  }

  return patches
}
