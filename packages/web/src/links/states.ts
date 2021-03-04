import { atom, selector, selectorFamily } from "recoil";
import { DataSourceType, LinkDocType } from '@oboku/shared'

export const normalizedLinksState = atom<Record<string, LinkDocType | undefined>>({
  key: 'linksState',
  default: {}
})

export const linksAsArrayState = selector<LinkDocType[]>({
  key: 'linksAsArrayState',
  get: ({ get }) => {
    const links = get(normalizedLinksState)

    return Object.values(links) as NonNullable<typeof links[number]>[]
  }
})

export const linkState = selectorFamily({
  key: 'bookLinkState',
  get: (linkId: string) => ({ get }) => {
    const links = get(normalizedLinksState)
    const link = Object.values(links).find(link => link?._id === linkId)

    if (!link) return undefined

    return {
      ...link,
      hasRemoteDataSource: ![DataSourceType.FILE, DataSourceType.URI].includes(link.type)
    }
  }
})