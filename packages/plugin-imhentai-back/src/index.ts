import {
  DataSourcePlugin,
  dataSourceHelpers,
  cheerio,
  fetch
} from "@oboku/plugin-back"
import {
  UNIQUE_RESOURCE_IDENTIFIER,
  BASE_URI,
  TYPE
} from "@oboku/plugin-imhentai-shared"

export const plugin: DataSourcePlugin = {
  type: TYPE,
  download: async () => {
    throw new Error(`Not implemented!`)
  },
  getMetadata: async (link) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(
      UNIQUE_RESOURCE_IDENTIFIER,
      link.resourceId
    )
    const uri = `${BASE_URI}/gallery/${galleryId}`

    const response = await fetch(uri)

    const $ = cheerio.load(await response.text())

    /**
     * first h1.title contains title. There can be several title such as original japanese one but will usually be inside h2 or others
     */
    const title = $(`.right_details h1`).text()

    const languages: string[] = []
    const creators: string[] = []
    const subjects: string[] = []

    $(`.galleries_info li`).each((_, e) => {
      const label = $(e).find(`.tags_text`).text()

      switch (label) {
        case `Languages:`: {
          $(e)
            .find(`a.tag`)
            .each((_, aElement) => {
              const textNode = aElement.firstChild
              if (textNode) {
                languages.push($(textNode).text().trim())
              }
            })
          break
        }
        case `Artists:`: {
          $(e)
            .find(`a.tag`)
            .each((_, aElement) => {
              const textNode = aElement.firstChild
              if (textNode) {
                creators.push($(textNode).text().trim())
              }
            })
          break
        }
        case `Tags:`: {
          $(e)
            .find(`a.tag`)
            .each((_, aElement) => {
              const textNode = aElement.firstChild
              if (textNode) {
                subjects.push($(textNode).text().trim())
              }
            })
          break
        }
        default:
      }
    })
    /**
     * This gives a link to usually first page
     */
    const coverPageUrl = `${BASE_URI}${$(`.left_cover a`).attr()?.href}`

    /**
     * Then we parse the cover page url and retrieve the original raw file link
     */
    const coverPageResponse = await fetch(coverPageUrl)
    const coverPage$ = cheerio.load(await coverPageResponse.text())

    const coverUrl = coverPage$(`#gimg`).data(`src`) as string | undefined

    return {
      name: title,
      languages,
      creators,
      subjects,
      coverUrl,
      /**
       * we have nothing to download.
       * we try to return all metadata from here
       */
      shouldDownload: false
    }
  },
  sync: async () => {
    throw new Error(`Not implemented`)
  }
}
