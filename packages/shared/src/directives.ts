/**
* Will extract any oboku normalized metadata that exist in the resource id string.
* Use this method to enrich the content that is being synchronized
* @example
* "foo [oboku~no_collection]" -> { isCollection: false }
* "foo [oboku~tags~bar]" -> { tags: ['bar'] }
* "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
*/
export const extractMetadataFromName = (resourceId: string): {
  isNotACollection: boolean,
  tags: string[],
  isIgnored: boolean,
  direction: 'rtl' | 'ltr' | undefined,
  isbn?: string | undefined
} => {
  let isNotACollection = false
  let tags: string[] = []
  let isIgnored = false
  let direction = undefined
  let isbn = undefined

  const directives = resourceId.match(/(\[oboku\~[^\]]*\])+/ig)?.map(str =>
    str.replace(/\[oboku~/, '')
      .replace(/\]/, '')
  )

  directives?.forEach(directive => {
    if (directive === 'no_collection') {
      isNotACollection = true
    }
    if (directive === 'ignore') {
      isIgnored = true
    }
    if (directive.startsWith('direction~')) {
      const value = directive.replace(/direction\~/, '')
      if (value === 'ltr' || value === 'rtl') {
        direction = value
      }
    }
    if (directive.startsWith('isbn~')) {
      const value = directive.replace(/isbn\~/, '')
      isbn = value
    }
    if (directive.startsWith('tags~')) {
      const newTags: string[] | undefined = directive.replace(/tags\~/, '').split(',')
      tags = [...tags, ...(newTags || [])]
    }
  })

  return {
    isNotACollection,
    tags,
    isIgnored,
    direction,
    isbn,
  }
}