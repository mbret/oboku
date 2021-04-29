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
export function createRangeOrCaretFromPoint(doc, startX, startY) {
    if (typeof doc.caretPositionFromPoint != "undefined") {
        return doc.caretPositionFromPoint(startX, startY);
    }
    else if (typeof doc.caretRangeFromPoint != "undefined") {
        return doc.caretRangeFromPoint(startX, startY);
    }
}
export const getFirstVisibleNodeFromPoint = (doc, startX, startY) => {
    const res = createRangeOrCaretFromPoint(doc, startX, startY);
    // console.warn(res)
    // debugger
    if (!res)
        return undefined;
    // if (`startContainer` in res) return res.startContainer
    if (`startContainer` in res)
        return res;
    // if (`offsetNode` in res) return res.offsetNode
    return undefined;
};
//# sourceMappingURL=dom.js.map