/* eslint-disable no-useless-escape */
const BASE_DETECTION_REGEX = `\\[oboku\\~[^\\]]*\\]`

/**
 * Will extract any oboku normalized metadata that exist in the resource id string.
 * Use this method to enrich the content that is being synchronized
 * @example
 * "foo [oboku~no_collection]" -> { isCollection: false }
 * "foo [oboku~tags~bar]" -> { tags: ['bar'] }
 * "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
 */
export const extractDirectivesFromName = (
  resourceId: string,
): {
  isNotACollection: boolean
  tags: string[]
  isIgnored: boolean
  direction: "rtl" | "ltr" | undefined
  isbn?: string | undefined
  series: boolean | undefined
  year?: string | undefined
  ignoreMetadataFile: boolean
  ignoreMetadataSources: boolean
  isWebtoon: boolean
  metadataTitle?: string | undefined
  googleVolumeId?: string | undefined
} => {
  let isNotACollection = false
  let tags: string[] = []
  let isIgnored = false
  let direction: "rtl" | "ltr" | undefined = undefined
  let year: string | undefined = undefined
  let isbn: string | undefined = undefined
  let series: boolean | undefined = undefined
  let ignoreMetadataFile = false
  let ignoreMetadataSources = false
  let metadataTitle: string | undefined = undefined
  let isWebtoon = false
  let googleVolumeId: string | undefined = undefined

  const directives = resourceId
    .match(/(\[oboku\~[^\]]*\])+/gi)
    ?.map((str) => str.replace(/\[oboku~/, "").replace(/\]/, ""))

  directives?.forEach((directive) => {
    if (directive === "no_collection") {
      isNotACollection = true
    }

    if (directive === "webtoon") {
      isWebtoon = true
    }

    if (directive.startsWith("google-volume-id~")) {
      const value = directive.replace(/google-volume-id\~/, "")
      googleVolumeId = value
    }

    if (directive.startsWith("metadata-ignore-file")) {
      ignoreMetadataFile = true
    }

    if (directive.startsWith("metadata-ignore-sources")) {
      ignoreMetadataSources = true
    }

    if (directive.startsWith("metadata-title~")) {
      const value = directive.replace(/metadata-title\~/, "")
      metadataTitle = value
    }

    if (directive === "ignore") {
      isIgnored = true
    }

    if (directive === "series") {
      series = true
    }

    if (directive.startsWith("year~")) {
      const value = directive.replace(/year\~/, "")
      year = value
    }

    if (directive.startsWith("direction~")) {
      const value = directive.replace(/direction\~/, "")
      if (value === "ltr" || value === "rtl") {
        direction = value
      }
    }

    if (directive.startsWith("isbn~")) {
      const value = directive.replace(/isbn\~/, "")
      isbn = value
    }

    if (directive.startsWith("tags~")) {
      const newTags: string[] | undefined = directive
        .replace(/tags\~/, "")
        .split(",")
      tags = [...tags, ...(newTags || [])]
    }
  })

  return {
    series,
    isNotACollection,
    tags,
    isIgnored,
    direction,
    isbn,
    year,
    ignoreMetadataFile,
    ignoreMetadataSources,
    isWebtoon,
    metadataTitle,
    googleVolumeId,
  }
}

export const removeDirectiveFromString = (str: string) =>
  str
    .replace(new RegExp(`( ${BASE_DETECTION_REGEX})+`, "ig"), "")
    .replace(new RegExp(`(${BASE_DETECTION_REGEX} )+`, "ig"), "")
    .replace(new RegExp(`(${BASE_DETECTION_REGEX})+`, "ig"), "")
