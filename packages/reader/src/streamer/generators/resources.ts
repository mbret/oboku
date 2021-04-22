import { getArchiveOpfInfo } from "../archiveHelpers"
import { Archive } from "../types"

export const generateResourceResponse = async (archive: Archive, resourcePath: string) => {
  const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive)
  const treatAsImageArchive = !opsFile

  if (treatAsImageArchive) {
    const file = Object.values(archive.files).find(file => file.name === resourcePath)
    if (!file) {
      throw new Error('no file found')
    }
    const imgAsBase64 = await file?.async('base64')
    const htmlFile = `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
        <head></head>
        <body>
        <img 
          xmlns="http://www.w3.org/1999/xhtml" 
          src="data:image/jpeg;base64, ${imgAsBase64}" 
          alt="img"
          style="width: 100%;height:100%;object-fit:contain;"
        />
        </body>
      </html>
    `

    const response = new Response(htmlFile, {
      status: 200, headers: {
        'Content-Type': `text/html; charset=UTF-8`,
        'Cache-Control': `no-cache, no-store, no-transform`
      }
    })

    // cache.put(event.request, response.clone())

    return response
  } else {
    const file = Object.values(archive.files).find(file => file.name === resourcePath)
    if (!file) {
      throw new Error('no file found')
    }

    const response = new Response(await file.async('blob'), {
      status: 200, headers: {
        ...file.name.endsWith(`.css`) && {
          'Content-Type': `text/css; charset=UTF-8`
        },
        ...file.name.endsWith(`.jpg`) && {
          'Content-Type': `image/jpg`
        },
        'Cache-Control': `no-cache, no-store, no-transform`
      }
    })

    // cache.put(event.request, response.clone())

    return response
  }
}