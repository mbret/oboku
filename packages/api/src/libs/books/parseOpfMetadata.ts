import { OPF } from "@oboku/shared"
import { NormalizedMetadata } from "./types"

const extractLanguage = (metadata?: undefined | null | string | { ['#text']?: string }): string | null => {
  if (!metadata) return null

  if (typeof metadata === 'string') return metadata

  if (metadata['#text']) return metadata['#text']

  return null
}

export const parseOpfMetadata = (opf: OPF): NormalizedMetadata => {
  const metadata = opf.package?.metadata || {}
  const creator = metadata['dc:creator']

  return {
    title: typeof metadata['dc:title'] === 'object'
      ? metadata['dc:title']['#text']
      : metadata['title'] || metadata['dc:title'],
    publisher: typeof metadata['dc:publisher'] === 'string'
      ? metadata['dc:publisher']
      : typeof metadata['dc:publisher'] === 'object'
        ? metadata['dc:publisher']['#text']
        : undefined,
    rights: metadata['dc:rights'] as string | undefined,
    language: extractLanguage(metadata['dc:language']),
    date: metadata['dc:date']
      ? new Date(metadata['dc:date'])
      : undefined,
    subject: Array.isArray(metadata['dc:subject'])
      ? metadata['dc:subject'] as string[]
      : typeof metadata['dc:subject'] === 'string' ? [metadata['dc:subject']] as string[] : null,
    creator: Array.isArray(creator)
      ? creator[0]['#text']
      : typeof creator === 'object'
        ? creator['#text']
        : creator,
  }
}