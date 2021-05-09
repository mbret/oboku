import { Report } from "../../../report"
import { IFRAME_EVENT_BRIDGE_ELEMENT_ID } from "../../constants"
import { Context } from "../../context"

const pointerEvents = [
  "pointercancel" as const,
  "pointerdown" as const,
  "pointerenter" as const,
  "pointerleave" as const,
  "pointermove" as const,
  "pointerout" as const,
  "pointerover" as const,
  "pointerup" as const
]
const mouseEvents = [
  'mousedown' as const,
  'mouseup' as const,
  'mouseenter' as const,
  'mouseleave' as const,
  'mousemove' as const,
  'mouseout' as const,
  'mouseover' as const,
]

export const applyHooks = (context: Context, rootDocument: Document, frame: HTMLIFrameElement) => {
  if (frame.contentDocument) {
    hookAnchorLinks(context, frame.contentDocument)
    hookMouseEvents(context, rootDocument, frame)
  }

  if (frame.contentDocument && frame.contentWindow) {
    const body = frame.contentDocument.body
    // const s = body.ownerDocument.createElementNS(`span`, {is})
    // const s = body.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", 'div')
    // s.style.cssText = '{}'
    // while (body.childNodes.length > 0) {
    //   const child = body.childNodes[0]
    //   if (child) {
    //     s.appendChild(child);
    //   }
    // }
    // body.innerHTML = ``
    // body.append(s)
    // @ts-ignore
    // body.replaceChildren(s)
    // body.append(s)
    // s.innerText = `asdasd`
    // s.style.display = `block`
    // Array.from(body.children).forEach(e => {
    //   // @ts-ignore
    //   e.style.writingMode = frame.contentWindow.getComputedStyle(body).writingMode
    // })
    // s.style.writingMode = frame.contentWindow.getComputedStyle(body).writingMode
    // body.style.writingMode = `horizontal-tb`
  }
}

const hookAnchorLinks = (context: Context, frameDocument: Document) => {
  Array.from(frameDocument.querySelectorAll('a')).forEach(element => element.addEventListener('click', (e) => {
    if (e.target && `style` in e.target && `ELEMENT_NODE` in e.target) {
      Report.warn(`prevented click on`, element, e)
      context.emit({ event: `linkClicked`, data: element })
      e.preventDefault()
    }
  }))
}

const hookMouseEvents = (context: Context, _: Document, frame: HTMLIFrameElement) => {
  pointerEvents.forEach(event => {
    frame.contentDocument?.addEventListener(event, (e) => {
      context.emit({ event: 'iframeEvent', data: { frame, event: e } })
    })
  })
  mouseEvents.forEach(event => {
    frame.contentDocument?.addEventListener(event, (e) => {
      context.emit({ event: 'iframeEvent', data: { frame, event: e } })
    })
  })
}