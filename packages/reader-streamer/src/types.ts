interface Async {
  (format: 'string' | 'base64'): Promise<string>
  (format: 'blob'): Promise<Blob>
}

export type Archive = {
  filename: string,
  files: {
    dir: boolean
    name: string
    blob: () => Promise<Blob>
    string: () => Promise<string>
    base64: () => Promise<string>
    size: number,
    encodingFormat?: undefined | `text/plain`
  }[]
}

type TocItem = {
  title: string,
  path: string,
  contents: TocItem[]
}

export type Manifest = {
  filename: string,
  nav: {
    toc: TocItem[]
  },
  title: string
  renditionLayout:  `reflowable` | `pre-paginated` | undefined
  readingDirection: 'ltr' | 'rtl',
  readingOrder: {
    id: string,
    href: string,
    path: string,
    renditionLayout: `reflowable` | `pre-paginated`,
    progressionWeight: number
  }[]
}