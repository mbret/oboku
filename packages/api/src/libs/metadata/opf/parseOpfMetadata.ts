import { Metadata } from "@libs/metadata/types"
import { OPF } from "@oboku/shared"
import { extractDateComponents } from "../extractDateComponents"

const extractLanguage = (
  metadata?: undefined | null | string | { ["#text"]?: string }
): string | null => {
  if (!metadata) return null

  if (typeof metadata === "string") return metadata

  if (metadata["#text"]) return metadata["#text"]

  return null
}

const normalizeDate = (date: NonNullable<NonNullable<OPF['package']>['metadata']>['dc:date']) => {
  if (!date) return {year: undefined, month: undefined, day: undefined}

  if (typeof date === "string") return extractDateComponents(date)

  return extractDateComponents(String(date["#text"]))
}

export const parseOpfMetadata = (opf: OPF): Omit<Metadata, "type"> => {
  const metadata = opf.package?.metadata || {}
  const creatrawCreator = metadata["dc:creator"]

  const language = extractLanguage(metadata["dc:language"])
  const creator = Array.isArray(creatrawCreator)
    ? (creatrawCreator[0] ?? {})["#text"]
    : typeof creatrawCreator === "object"
      ? creatrawCreator["#text"]
      : creatrawCreator

  const subjects = Array.isArray(metadata["dc:subject"])
    ? (metadata["dc:subject"] as string[])
    : typeof metadata["dc:subject"] === "string"
      ? ([metadata["dc:subject"]] as string[])
      : null

  return {
    title:
      typeof metadata["dc:title"] === "object"
        ? metadata["dc:title"]["#text"]
        : metadata["title"] || metadata["dc:title"],
    publisher:
      typeof metadata["dc:publisher"] === "string"
        ? metadata["dc:publisher"]
        : typeof metadata["dc:publisher"] === "object"
          ? metadata["dc:publisher"]["#text"]
          : undefined,
    rights: metadata["dc:rights"] as string | undefined,
    languages: language ? [language] : [],
    date: normalizeDate(metadata["dc:date"]),
    subjects: subjects ? subjects : [],
    authors: creator ? [creator] : []
  }
}
