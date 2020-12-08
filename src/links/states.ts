import { atom, selector } from "recoil";
import { LinkDocType } from 'oboku-shared'

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