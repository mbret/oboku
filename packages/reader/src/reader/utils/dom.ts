// export function createSelectionFromPoint(startX: number, startY: number, endX: number, endY: number) {
//   var doc = document;
//   var start, end, range = null;
//   if (typeof doc.caretPositionFromPoint != "undefined") {
//     start = doc.caretPositionFromPoint(startX, startY);
//     end = doc.caretPositionFromPoint(endX, endY);
//     range = doc.createRange();
//     range.setStart(start.offsetNode, start.offset);
//     range.setEnd(end.offsetNode, end.offset);
//   } else if (typeof doc.caretRangeFromPoint != "undefined") {
//     start = doc.caretRangeFromPoint(startX, startY);
//     end = doc.caretRangeFromPoint(endX, endY);
//     range = doc.createRange();
//     range.setStart(start.startContainer, start.startOffset);
//     range.setEnd(end.startContainer, end.startOffset);
//   }
//   if (range !== null && typeof window.getSelection != "undefined") {
//     var sel = window.getSelection();
//     sel.removeAllRanges();
//     sel.addRange(range);
//   } else if (typeof doc.body.createTextRange != "undefined") {
//     range = doc.body.createTextRange();
//     range.moveToPoint(startX, startY);
//     var endRange = range.duplicate();
//     endRange.moveToPoint(endX, endY);
//     range.setEndPoint("EndToEnd", endRange);
//     range.select();
//   }
// }

// export function createRangeOrCaretFromPoint(doc: Document, startX: number, startY: number) {
//   if (typeof doc.caretPositionFromPoint != "undefined") {
//     return doc.caretPositionFromPoint(startX, startY);
//   } else if (typeof doc.caretRangeFromPoint != "undefined") {
//     return doc.caretRangeFromPoint(startX, startY);
//   }
// }

// export const getFirstVisibleNodeFromPoint = (doc: Document, startX: number, startY: number) => {
//   const res = createRangeOrCaretFromPoint(doc, startX, startY)

//   return res
// }

type ViewPort = { left: number, right: number, top: number, bottom: number }

export const getFirstVisibleNodeForViewport = (documentOrElement: Document | Element, viewport: ViewPort) => {
  const element = (`body` in documentOrElement)
    ? getFirstVisibleElementForViewPort(documentOrElement, viewport)
    : getFirstElementForViewport(documentOrElement, viewport)

  const ownerDocument = `createRange` in documentOrElement ? documentOrElement : documentOrElement.ownerDocument

  if (element) {
    let lastValidRange: Range | undefined

    const range = ownerDocument.createRange()

    Array.from(element.childNodes).some(childNode => {
      range.selectNodeContents(childNode)
      const childNodePosition = getElementOrNodePositionFromViewPort(range.getBoundingClientRect(), viewport)
      if (childNodePosition !== 'before' && childNodePosition !== 'after') {
        lastValidRange = range.cloneRange()

        return true
      }
      return false
    })
    // console.warn(`getElementForViewPort`, viewport, element, { lastValidRange, childNodes: element.childNodes })

    if (lastValidRange) {

      // we have a range, we now try to get the valid offset
      // @todo rtl
      // @todo vertical-lrt
      // @todo vertical-rtl
      // @todo THIS KILLS performances completely, find another way
      let clientRect = lastValidRange.getBoundingClientRect()
      // console.warn(`detect range`, {clientRect, viewport})
      // while (lastValidRange.startOffset < lastValidRange.endOffset && clientRect.left < viewport.left) {
      //   lastValidRange.setStart(lastValidRange.startContainer, lastValidRange.startOffset + 1)
      //   clientRect = lastValidRange.getBoundingClientRect()
      // }

      // return { node: lastValidRange.startContainer, offset: lastValidRange.startOffset }
      return { node: lastValidRange.startContainer, offset: 0 }
    }

    return { node: element, offset: 0 }
  }

  return undefined
}

function getFirstVisibleElementForViewPort(document: Document, viewport: ViewPort) {
  return getFirstElementForViewport(document.body, viewport)
}

const getFirstElementForViewport = (element: Element, viewport: ViewPort) => {
  let lastValidElement: Element | undefined = undefined
  const positionFromViewport = getElementOrNodePositionFromViewPort(element.getBoundingClientRect(), viewport)

  if (positionFromViewport !== 'before' && positionFromViewport !== 'after') {
    lastValidElement = element
  }

  Array.from(element.children).some(child => {
    const childInViewPort = getFirstElementForViewport(child, viewport)
    if (childInViewPort) {
      lastValidElement = childInViewPort

      return true
    }

    return false
  })

  return lastValidElement
}

function getElementOrNodePositionFromViewPort(domRect: DOMRect, { left, right }: ViewPort) {
  // horizontal + ltr
  if (domRect.left <= left && domRect.right <= left) return 'before';
  if (domRect.left <= left && domRect.right > left && domRect.right <= right) return 'partially-before';
  if (domRect.left <= right && domRect.right > right) return 'partially-after';
  if (domRect.left > right) return 'after';
  return 'within';

  // @todo rtl
  // @todo vertical-lrt
  // @todo vertical-rtl
}