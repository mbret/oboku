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

    console.log(uri, $(`h1.title`).text())

    return {
      name: title,
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