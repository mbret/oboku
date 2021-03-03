import { Rendition, Contents } from "epubjs"
import { useEffect } from "react"
import { useRecoilValue } from "recoil"
import { layoutState } from "./states"

export const useEpubjsPanRecognizerHook = (rendition: Rendition | undefined) => {
  const layout = useRecoilValue(layoutState)

  useEffect(() => {
    const hook = (contents: Contents, rendition: Rendition) => {
      return Promise.all([
        contents.addStylesheet(`/epubjsscript.css`),
        contents.addScript('/hammer-2.0.8.min.js').then(() => {
          return contents.addScript(`/epubjsscript.js`)
        }),
      ])
    }

    rendition?.hooks.content.register(hook)

    return () => {
      rendition?.hooks.content.deregister(hook)
    }
  }, [rendition, layout])
}

export const useEpubjsVerticalCentererRendererHook = (rendition: Rendition | undefined) => {
  const layout = useRecoilValue(layoutState)

  useEffect(() => {
    const hook = (contents: Contents, rendition: Rendition) => {
      console.log(`HOOK content`, contents, rendition)
      const $bodyList = contents.document.getElementsByTagName('body')
      const $body = $bodyList.item(0)
      if (layout === 'fixed') {
        const windowInnerHeight = contents.window.innerHeight
        const windowInnerWidth = contents.window.innerWidth

        if ($body) {
          const height = $body.getBoundingClientRect().height
          const width = $body.getBoundingClientRect().width
          var scaleX = $body.getBoundingClientRect().width / $body.offsetWidth;

          // align vertically the body in case of content height is lower
          if (height < windowInnerHeight) {
            $body.style.paddingTop = `${((windowInnerHeight - height) / 2) / scaleX}px`
            console.warn(`useVerticalCentererRendererHook -> re-center with padding of ${$body.style.paddingTop}`)
          }

          // align horizontally the body in case of content height is lower
          if (width < windowInnerWidth) {
            // sometime books will use margin themselves to play with alignment of images. this is to give some
            // style and dynamic in the reading. In this case we try to not override any margin behavior
            if (!$body.style.marginLeft) {
              $body.style.paddingLeft = `${((windowInnerWidth - width) / 2) / scaleX}px`
              console.warn(`useVerticalCentererRendererHook -> re-center with padding of ${$body.style.paddingTop}`)
            }
          }
        }
      }

      // if ($body) {
      //   $body.style.height = '100%'
      // }

      // return Promise.all([
      //   contents.addScript('/hammer-2.0.8.min.js').then(() => {
      //     return contents.addScript(`/epubjsscript.js`)
      //   }),
      // ])
    }

    rendition?.hooks.content.register(hook)

    const renderHook = (iframeView: any, rendition: Rendition) => {
      console.log(`HOOK render`, iframeView, rendition, getViewportDimensions(iframeView.iframe))

      // rendition.injectScript(iframeView.document, iframeView.section)
      // iframeView.iframe.style.setProperty('--scale', `0.8`)
      // iframeView.iframe.style.setProperty('width', `500px`)
      // iframeView.iframe.style.setProperty('height', `500px`)
      // iframeView.iframe.style.width = `${size.width}px`
      // iframeView.iframe.style.height = `${size.height}px`
    }

    rendition?.hooks.render?.register(renderHook)

    // rendition?.book.spine.hooks.content.register((...a) => console.log('HOOK content', ...a))
    // rendition?.book.spine.hooks.serialize.register((...a) => console.log('HOOK serialize', ...a))
    // rendition?.hooks.display?.register((...a) => console.log('HOOK display', ...a))
    // rendition?.hooks.layout?.register((...a) => console.log('HOOK layout', ...a))
    // rendition?.hooks.show?.register((...a) => console.log('HOOK show', ...a))

    return () => {
      rendition?.hooks.content.deregister(hook)
      rendition?.hooks.render.deregister(renderHook)
    }
  }, [rendition, layout])
}

const getViewportDimensions = (frame: any) => {
  if (frame && frame.contentDocument) {
    const doc = frame.contentDocument
    const viewPortMeta = doc.querySelector("meta[name='viewport']")
    if (viewPortMeta) {
      return viewPortMeta
      // const viewPortMetaInfos = viewPortMeta.getAttribute('content')
      // if (viewPortMetaInfos) {
      //   const width = this.getAttributeValueFromString(
      //     viewPortMetaInfos,
      //     'width'
      //   )
      //   const height = this.getAttributeValueFromString(
      //     viewPortMetaInfos,
      //     'height'
      //   )
      //   if (width > 0 && height > 0) {
      //     return {
      //       width: width,
      //       height: height,
      //     }
      //   } else {
      //     return undefined
      //   }
      // }
    }
  }

  return undefined
}