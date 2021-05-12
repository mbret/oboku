import { Observable, Subject } from "rxjs";
import { Report } from "../../report";
import { Enhancer } from "../createReader";

type SubjectData = { event: 'linkClicked', data: HTMLAnchorElement }

export const linksEnhancer: Enhancer<{
  links$: Observable<SubjectData>
}> = (next) => (options) => {
  const reader = next(options)
  const subject = new Subject<SubjectData>()

  const handleNavigationForClick = (element: HTMLAnchorElement) => {
    const hrefUrl = new URL(element.href)
    const hrefWithoutAnchor = `${hrefUrl.origin}${hrefUrl.pathname}`
    // internal link, we can handle
    const hasExistingSpineItem = reader.context.getManifest()?.readingOrder.some(item => item.href === hrefWithoutAnchor)
    if (hasExistingSpineItem) {
      reader.readingOrderView.goToUrl(hrefUrl)
    }
  }

  reader.readingOrderView.registerReadingItemHook(`onLoad`, ({ frame }) => {
    if (frame.contentDocument) {
      Array.from(frame.contentDocument.querySelectorAll('a')).forEach(element => element.addEventListener('click', (e) => {
        if (e.target && `style` in e.target && `ELEMENT_NODE` in e.target) {
          Report.warn(`prevented click on`, element, e)
          e.preventDefault()
          handleNavigationForClick(element)
          subject.next({ event: 'linkClicked', data: element })
        }
      }))
    }
  })

  return {
    ...reader,
    links$: subject.asObservable(),
  }
}