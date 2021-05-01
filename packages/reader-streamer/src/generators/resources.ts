import { getArchiveOpfInfo } from "../archiveHelpers"
import { Archive } from "../types"

export const generateResourceResponse = async (archive: Archive, resourcePath: string) => {
  const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive)
  const treatAsImageArchive = !opsFile
  const file = Object.values(archive.files).find(file => file.name === resourcePath)

  if (!file) {
    throw new Error('no file found')
  }

  if (file.encodingFormat === 'text/plain') {
    const content = await file.string()
    const htmlFile = `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
        <head>
          <style>
            pre {
              white-space: pre;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
        <pre>${content}</pre>
        </body>
      </html>
    `

    const response = new Response(htmlFile, {
      status: 200, headers: {
        'Content-Type': `text/html; charset=UTF-8`,
        'Cache-Control': `no-cache, no-store, no-transform`
      }
    })

    return response
  }

  if (treatAsImageArchive) {
    
    const imgAsBase64 = await file?.base64()
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
  }

  const response = new Response(await file.blob(), {
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

  return response
}