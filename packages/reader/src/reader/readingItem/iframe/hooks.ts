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
}

const hookAnchorLinks = (context: Context, frameDocument: Document) => {
  Array.from(frameDocument.querySelectorAll('a')).forEach(element => element.addEventListener('click', (e) => {
    if (e.target && `style` in e.target && `ELEMENT_NODE` in e.target) {
      const element = e.target as HTMLElement
      Report.warn(`prevented click on`, element)
      context.emit({ event: `linkClicked`, data: element as HTMLAnchorElement })
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