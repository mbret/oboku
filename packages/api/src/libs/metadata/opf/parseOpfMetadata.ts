import { Metadata } from "@libs/metadata/types"
import { OPF } from "@oboku/shared"
import { extractDateComponents } from "../extractDateComponents"

const extractLanguage = (
  metadata?: undefined | null | string | { ["#text"]?: string },
): string | null => {
  if (!metadata) return null

  if (typeof metadata === "string") return metadata

  if (metadata["#text"]) return metadata["#text"]

  return null
}

const normalizeDate = (
  date: NonNullable<NonNullable<OPF["package"]>["metadata"]>["dc:date"],
) => {
  if (!date) return { year: undefined, month: undefined, day: undefined }

  if (typeof date === "string") return extractDateComponents(date)

  return extractDateComponents(String(date["#text"]))
}

const findCoverPathFromOpf = (opf: OPF) => {
  const manifest = opf.package?.manifest
  const meta = opf.package?.metadata?.meta
  const normalizedMeta = Array.isArray(meta) ? meta : meta ? [meta] : []
  const coverInMeta = normalizedMeta.find(
    (item) => item?.name === "cover" && (item?.content?.length || 0) > 0,
  )
  let href = ""

  const isImage = (
    item: NonNullable<NonNullable<typeof manifest>["item"]>[number],
  ) =>
    item["media-type"] &&
    (item["media-type"].indexOf("image/") > -1 ||
      item["media-type"].indexOf("page/jpeg") > -1 ||
      item["media-type"].indexOf("page/png") > -1)

  if (coverInMeta) {
    const item = manifest?.item?.find(
      (item) => item.id === coverInMeta?.content && isImage(item),
    )

    if (item) {
      return item?.href
    }
  }

  manifest?.item?.find((item) => {
    const indexOfCover = item?.id?.toLowerCase().indexOf("cover")
    if (indexOfCover !== undefined && indexOfCover > -1 && isImage(item)) {
      href = item.href || ""
    }
    return ""
  })

  return href
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
    authors: creator ? [creator] : [],
    coverLink: findCoverPathFromOpf(opf),
  }
}
