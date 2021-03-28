export type OPF = {
  package?: {
    manifest?: {
      item?: {
        id?: string
        href?: string
        'media-type'?: string
      }[]
    },
    metadata?: {
      'dc:title'?: string | {
        '#text': string;
      }
      'title'?: any,
      'dc:date'?: any,
      'dc:creator'?: { '#text'?: string } | { '#text'?: string }[],
      'dc:subject'?: any,
      'dc:language'?: any,
      'dc:publisher'?: { '#text': string, id: string } | string,
      'dc:rights'?: any,
      meta?: {
        name?: 'cover' | 'unknown'
        content?: string
      } | {
        name?: 'cover' | 'unknown'
        content?: string
      }[]
    }
  }
}