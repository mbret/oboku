import { dataSourceHelpers, dataSourcePlugins } from "@oboku/shared/src";
import { DataSourcePlugin } from "../types";
import { load } from "cheerio";
import { BASE_URI } from "./constants";
import fetch from "node-fetch";

export const plugin: DataSourcePlugin = {
  ...dataSourcePlugins.NHENTAI,
  download: async (link) => {
    throw new Error(`Not implemented`)
  },
  getMetadata: async (link) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(dataSourcePlugins.NHENTAI.uniqueResourceIdentifier, link.resourceId)
    const uri = `${BASE_URI}/g/${galleryId}`

    const response = await fetch(uri)

    const $ = load(await response.text())

    /**
     * first h1.title contains title. There can be several title such as original japanese one but will usually be inside h2 or others
     */
    const title = $(`h1.title`).text()
    /**
     * there are both <a> and <img> inside. The a link target the 1 item of the book and is original size. The <img> is used by the
     * website for cover on the gallery home and is usually resized. We want to use the <a> in order to work with the original size.
     * We get something like `/g/1235/1/`
     */
    const coverUrl = `${BASE_URI}${$(`#cover a`).attr().href}`

    return {
      name: title,
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
  },
}