"use strict";
// import { Report } from "../report"
// import { extractInfoFromEvent } from "./eventHelpers"
// import { generateManifestFromArchive, generateManifestFromEpub } from "./generators/manifest"
// import { Archive } from "./types"
// export const interceptManifestHit = (event: FetchEvent, getArchive: (event: FetchEvent) => Promise<Archive>) => {
//   if (
//     event.request.url.includes(`/epubs/`)
//     && (
//       event.request.url.endsWith(`.epub`)
//       || event.request.url.endsWith(`.cbz`)
//     )
//   ) {
//     event.respondWith((async () => {
//       try {
//         const archive = await getArchive(event)
//         const manifest = event.request.url.endsWith(`.cbz`)
//           ? await generateManifestFromArchive(archive, event)
//           : await generateManifestFromEpub(archive, event)
//         const data = JSON.stringify(manifest)
//         return new Response(data, { status: 200 })
//       } catch (e) {
//         console.error(e)
//         return new Response(e, { status: 500 })
//       }
//     })())
//   }
// }
// export const interceptResourceHit = (event: FetchEvent, getArchive: (event: FetchEvent) => Promise<Archive>) => {
//   /**
//    * Serve resources
//    */
//   if (event.request.url.includes(`/epubs/`) && (!event.request.url.endsWith(`.epub`) && !event.request.url.endsWith(`.cbz`))) {
//     event.respondWith((Report.measurePerformance(`serveResource`, Infinity, async () => {
//       const cache = await caches.open(`epub`)
//       console.log(event)
//       const cachedResponse = await cache.match(event.request)
//       // if (cachedResponse) return cachedResponse
//       const uri = new URL(event.request.url)
//       const relativePath = uri.pathname.replace(`/epubs/`, ``)
//       const epubFilename = relativePath.substring(0, relativePath.indexOf(`/`)) // foo.epub
//       const { epubUrl, path } = extractInfoFromEvent(event)
//       console.log(uri, relativePath, epubFilename, path, epubUrl)
//       try {
//         const epubArchive = await getArchive(event)
//         if (epubUrl.endsWith(`.cbz`)) {
//           const filenameWithCorrectExtension = path.substring(0, path.lastIndexOf(`.`))
//           const file = Object.values(epubArchive.files).find(file => file.name.endsWith(filenameWithCorrectExtension))
//           if (!file) {
//             throw new Error('no file found')
//           }
//           const imgAsBase64 = await file?.async('base64')
//           const htmlFile = `
//             <!DOCTYPE html>
//             <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
//               <head></head>
//               <body>
//               <img 
//                 xmlns="http://www.w3.org/1999/xhtml" 
//                 src="data:image/jpeg;base64, ${imgAsBase64}" 
//                 alt="img"
//                 style="width: 100%;height:100%;object-fit:contain;"
//               />
//               </body>
//             </html>
//           `
//           const response = new Response(htmlFile, {
//             status: 200, headers: {
//               'Content-Type': `text/html; charset=UTF-8`,
//               'Cache-Control': `no-cache, no-store, no-transform`
//             }
//           })
//           cache.put(event.request, response.clone())
//           return response
//         } else {
//           const file = Object.values(epubArchive.files).find(file => file.name.endsWith(path))
//           if (!file) {
//             throw new Error('no file found')
//           }
//           const response = new Response(await file.async('blob'), {
//             status: 200, headers: {
//               ...file.name.endsWith(`.css`) && {
//                 'Content-Type': `text/css; charset=UTF-8`
//               },
//               ...file.name.endsWith(`.jpg`) && {
//                 'Content-Type': `image/jpg`
//               },
//               'Cache-Control': `no-cache, no-store, no-transform`
//             }
//           })
//           cache.put(event.request, response.clone())
//           return response
//         }
//       } catch (e) {
//         console.error(e)
//         return new Response(e, { status: 500 })
//       }
//     }))())
//   }
// }
//# sourceMappingURL=interceptors.js.map