/// <reference lib="webworker" />
//@ts-ignore
import JSZip, { loadAsync } from 'jszip'
import { Report } from '../../report'
import { generateArchiveFromTxtContent } from '../../streamer/generators/archives'
import { Archive } from '../../streamer/types'

let loading = false
let archive: Archive | undefined = undefined
let lastUrl: string | undefined

setInterval(() => {
  if (!loading && archive) {
    Report.log(`serviceWorker`, `cleaning up unused epub archive reference (after 5mn)`)
    archive = undefined
    lastUrl = undefined
  }
}, 5 * 60 * 1000)

export const loadEpub = Report.measurePerformance(`serviceWorker`, Infinity, async (url: string) => {
  if (url !== lastUrl) {
    archive = undefined
    loading = false
  }
  if (archive) {
    return archive
  }
  if (loading) {
    return new Promise<Archive>(resolve => {
      setTimeout(async () => {
        resolve(await loadEpub(url))
      }, 100)
    })
  }
  loading = true
  archive = undefined
  const response = await fetch(url)

  if (url.endsWith(`.txt`)) {
    const content = await response.text()
    archive = await generateArchiveFromTxtContent(content)
  } else {
    const epubData = await response.blob()
    const jszip = await loadAsync(epubData)

    archive = {
      filename: jszip.name,
      files: Object.values(jszip.files).map(file => ({
        dir: file.dir,
        name: file.name,
        blob: () => file.async('blob'),
        string: () => file.async('string'),
        base64: () => file.async('base64'),
        // this is private API
        // @ts-ignore
        size: file._data.uncompressedSize
      }))
    }
  }

  lastUrl = url
  loading = false

  return archive
})