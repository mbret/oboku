/**
 * @see https://github.com/fread-ink/epub-cfi-resolver
 * @latest a0d7e4e39d5b4adc9150e006e0b6d7af9513ae27
 */
'use strict';

var ELEMENT_NODE = Node.ELEMENT_NODE;
var TEXT_NODE = Node.TEXT_NODE;
var CDATA_SECTION_NODE = Node.CDATA_SECTION_NODE;

function cfiEscape(str: string) {
  return str.replace(/[\[\]\^,();]/g, "^$&");
}

// Get indices of all matches of regExp in str
// if `add` is non-null, add it to the matched indices
function matchAll(str: string, regExp: any, add: any) {
  add = add || 0;
  var matches = [];
  var offset = 0;
  var m;
  do {
    m = str.match(regExp);
    if (!m) break
    matches.push(m.index + add);
    // @ts-ignore
    offset += m.index + m.length;
    // @ts-ignore
    str = str.slice(m.index + m.length);
  } while (offset < str.length);

  return matches;
}

// Get the number in a that has the smallest diff to n
function closest(a: any[], n: number) {
  var minDiff;
  var closest;
  var i, diff;
  for (i = 0; i < a.length; i++) {
    diff = Math.abs(a[i] - n);
    // @ts-ignore
    if (!i || diff < minDiff) {
      diff = minDiff;
      closest = a[i];
    }
  }
  return closest;
}

// Given a set of nodes that are all children
// and a reference to one of those nodes
// calculate the count/index of the node
// according to the CFI spec.
// Also re-calculate offset if supplied and relevant
function calcSiblingCount(nodes: NodeListOf<ChildNode>, n: number, offset: number) {
  var count = 0;
  var lastWasElement;
  var prevOffset = 0;
  var firstNode = true;
  var i, node;
  for (i = 0; i < nodes.length; i++) {
    node = nodes[i];
    // @ts-ignore
    if (node.nodeType === ELEMENT_NODE) {
      if (lastWasElement || firstNode) {
        count += 2;
        firstNode = false;
      } else {
        count++;
      }

      // @ts-ignore
      if (n === node) {
        // @ts-ignore
        if (node.tagName.toLowerCase() === 'img') {
          return { count, offset };
        } else {
          return { count };
        }
      }
      prevOffset = 0;
      lastWasElement = true;
      // @ts-ignore
    } else if (node.nodeType === TEXT_NODE ||
      // @ts-ignore
      node.nodeType === CDATA_SECTION_NODE) {
      if (lastWasElement || firstNode) {
        count++;
        firstNode = false;
      }

      // @ts-ignore
      if (n === node) {
        return { count, offset: offset + prevOffset };
      }

      // @ts-ignore
      prevOffset += node.textContent.length;
      lastWasElement = false;
    } else {
      continue;
    }
  }
  throw new Error("The specified node was not found in the array of siblings");
}

function compareTemporal(a: number, b: number) {
  const isA = (typeof a === 'number');
  const isB = (typeof b === 'number');

  if (!isA && !isB) return 0;
  if (!isA && isB) return -1;
  if (isA && !isB) return 1;

  return (a || 0.0) - (b || 0.0);
}

function compareSpatial(a: any, b: any) {
  if (!a && !b) return 0;
  if (!a && b) return -1;
  if (a && !b) return 1;

  var diff = (a.y || 0) - (b.y || 0);
  if (diff) return diff;

  return (a.x || 0) - (b.x || 0);
}

class CFI {
  isRange: boolean = false
  parts: {}[]
  opts: {}
  cfi: string

  constructor(str: string, opts: {}) {
    this.opts = Object.assign({
      // If CFI is a Simple Range, pretend it isn't
      // by parsing only the start of the range
      flattenRange: false,
      // Strip temporal, spatial, offset and textLocationAssertion
      // from places where they don't make sense
      stricter: true
    }, opts || {});

    this.cfi = str;
    this.parts = [];
    const isCFI = new RegExp(/^epubcfi\((.*)\)$/);

    str = str.trim();
    var m = str.match(isCFI);
    if (!m) throw new Error("Not a valid CFI");
    if (m.length < 2) return; // Empty CFI

    str = m[1] || '';

    var parsed, offset, newDoc;
    var subParts = [];
    var sawComma = 0;
    while (str.length) {
      ({ parsed, offset, newDoc } = this.parse(str));
      if (!parsed || offset === null) throw new Error("Parsing failed");
      if (sawComma && newDoc) throw new Error("CFI is a range that spans multiple documents. This is not allowed");

      subParts.push(parsed);

      // Handle end of string
      if (newDoc || str.length - offset <= 0) {
        // Handle end if this was a range
        if (sawComma === 2) {
          // @ts-ignore
          this.to = subParts;
        } else { // not a range
          this.parts.push(subParts);
        }
        subParts = [];
      }

      str = str.slice(offset);

      // Handle Simple Ranges
      if (str[0] === ',') {
        if (sawComma === 0) {
          if (subParts.length) {
            this.parts.push(subParts);
          }
          subParts = [];
        } else if (sawComma === 1) {
          if (subParts.length) {
            // @ts-ignore
            this.from = subParts;
          }
          subParts = [];
        }
        str = str.slice(1);
        sawComma++;
      }
    }
    // @ts-ignore
    if (this.from && this.from.length) {
      // @ts-ignore
      if (this.opts.flattenRange || !this.to || !this.to.length) {
        // @ts-ignore
        this.parts = this.parts.concat(this.from);
        // @ts-ignore
        delete this.from;
        // @ts-ignore
        delete this.to;
      } else {
        this.isRange = true;
      }
    }
    // @ts-ignore
    if (this.opts.stricter) {
      // @ts-ignore
      this.removeIllegalOpts();
    }
  }

  removeIllegalOpts(parts: any[]) {
    if (!parts) {
      // @ts-ignore
      if (this.from) {
        // @ts-ignore
        this.removeIllegalOpts(this.from);
        // @ts-ignore
        if (!this.to) return;
        // @ts-ignore
        parts = this.to;
      } else {
        parts = this.parts;
      }
    }

    var i, j, part, subpart;
    for (i = 0; i < parts.length; i++) {
      part = parts[i];
      for (j = 0; j < part.length - 1; j++) {
        subpart = part[j];
        delete subpart.temporal;
        delete subpart.spatial;
        delete subpart.offset;
        delete subpart.textLocationAssertion;
      }
    }
  }

  static generatePart(node: Element | Node, offset?: number, extra?: {}) {
    var cfi = '';
    var o;
    while (node.parentNode) {
      // @ts-ignore
      o = calcSiblingCount(node.parentNode.childNodes, node, offset);
      if (!cfi && o.offset) cfi = ':' + o.offset;

      // console.log(node)
      // @ts-ignore
      cfi = '/' + o.count + ((node.id) ? '[' + cfiEscape(node.id) + ']' : '') + cfi;

      // debugger
      // console.log(`generatePart`, node.parentNode, cfi)
      node = node.parentNode;
    }

    return cfi;
  }

  static generate(node: Node, offset?: number, extra?: {}) {
    var cfi;

    if (node instanceof Array) {
      var strs = [];
      for (let o of node) {
        strs.push(this.generatePart(o.node, o.offset, extra));
      }
      cfi = strs.join('!');
    } else {
      cfi = this.generatePart(node, offset, extra);
    }

    if (extra) cfi += extra;

    return 'epubcfi(' + cfi + ')';
  }

  static toParsed(cfi: any) {
    // @ts-ignore
    if (typeof cfi === 'string') cif = new this(cfi);
    if (cfi.isRange) {
      return cfi.getFrom();
    } else {
      return cfi.get();
    }
  }


  // Takes two CFI paths and compares them
  static comparePath(a: any[], b: any[]) {
    const max = Math.max(a.length, b.length);

    var i, cA, cB, diff;
    for (i = 0; i < max; i++) {
      cA = a[i];
      cB = b[i];
      if (!cA) return -1;
      if (!cB) return 1;

      diff = this.compareParts(cA, cB);
      if (diff) return diff;
    }
    return 0;
  }

  // Sort an array of CFI objects
  static sort(a: any) {
    // @ts-ignore
    a.sort((a, b) => {
      return this.compare(a, b)
    });
  }

  // Takes two CFI objects and compares them.
  static compare(a: any, b: any) {
    var oA = a.get();
    var oB = b.get();
    if (a.isRange || b.isRange) {
      if (a.isRange && b.isRange) {
        var diff = this.comparePath(oA.from, oB.from);
        if (diff) return diff;
        return this.comparePath(oA.to, oB.to);
      }
      if (a.isRange) oA = oA.from;
      if (b.isRange) oB = oB.from;

      return this.comparePath(oA, oB);

    } else { // neither a nor b is a range

      return this.comparePath(oA, oB);
    }
  }

  // Takes two parsed path parts (assuming path is split on '!') and compares them.
  static compareParts(a: any, b: any) {
    const max = Math.max(a.length, b.length);

    var i, cA, cB, diff;
    for (i = 0; i < max; i++) {
      cA = a[i];
      cB = b[i];
      if (!cA) return -1;
      if (!cB) return 1;

      diff = cA.nodeIndex - cB.nodeIndex;
      if (diff) return diff;

      // The paths must be equal if the "before the first node" syntax is used
      // and this must be the last subpart (assuming a valid CFI)
      if (cA.nodeIndex === 0) {
        return 0;
      }

      // Don't bother comparing offsets, temporals or spatials
      // unless we're on the last element, since they're not
      // supposed to be on elements other than the last
      if (i < max - 1) continue;

      // Only compare spatials or temporals for element nodes
      if (cA.nodeIndex % 2 === 0) {

        diff = compareTemporal(cA.temporal, cB.temporal);
        if (diff) return diff;

        diff = compareSpatial(cA.spatial, cB.spatial);
        if (diff) return diff;

      }

      diff = (cA.offset || 0) - (cB.offset || 0);
      if (diff) return diff;
    }
    return 0;
  }

  decodeEntities(dom: Document, str: string) {
    try {
      const el = dom.createElement('textarea');
      el.innerHTML = str;
      return el.value || ''
    } catch (err) {
      // TODO fall back to simpler decode?
      // e.g. regex match for stuff like &#160; and &nbsp;
      return str;
    }
  }

  // decode HTML/XML entities and compute length
  trueLength(dom: Document, str: string) {
    return this.decodeEntities(dom, str).length;
  }

  getFrom() {
    if (!this.isRange) throw new Error("Trying to get beginning of non-range CFI");
    // @ts-ignore
    if (!this.from) {
      return this.deepClone(this.parts);
    }
    const parts = this.deepClone(this.parts);
    // @ts-ignore
    parts[parts.length - 1] = parts[parts.length - 1].concat(this.from);
    return parts;
  }

  getTo() {
    if (!this.isRange) throw new Error("Trying to get end of non-range CFI");
    const parts = this.deepClone(this.parts);
    // @ts-ignore
    parts[parts.length - 1] = parts[parts.length - 1].concat(this.to);
    return parts
  }

  get() {
    if (this.isRange) {
      return {
        from: this.getFrom(),
        to: this.getTo(),
        isRange: true
      };
    }
    return this.deepClone(this.parts);
  }

  parseSideBias(o: any, loc: any) {
    if (!loc) return;
    const m = loc.trim().match(/^(.*);s=([ba])$/);
    if (!m || m.length < 3) {
      if (typeof o.textLocationAssertion === 'object') {
        o.textLocationAssertion.post = loc;
      } else {
        o.textLocationAssertion = loc;
      }
      return;
    }
    if (m[1]) {
      if (typeof o.textLocationAssertion === 'object') {
        o.textLocationAssertion.post = m[1];
      } else {
        o.textLocationAssertion = m[1];
      }
    }

    if (m[2] === 'a') {
      o.sideBias = 'after';
    } else {
      o.sideBias = 'before';
    }
  }

  parseSpatialRange(range: any) {
    if (!range) return undefined;
    const m = range.trim().match(/^([\d\.]+):([\d\.]+)$/);
    if (!m || m.length < 3) return undefined;
    const o = {
      x: parseInt(m[1]),
      y: parseInt(m[2]),
    };
    if (typeof o.x !== 'number' || typeof o.y !== 'number') {
      return undefined;
    }
    return o;
  }

  parse(cfi: any) {
    var o = {};
    const isNumber = new RegExp(/[\d]/);
    var f;
    var state;
    var prevState;
    var cur, escape;
    var seenColon = false;
    var seenSlash = false;
    var i;
    for (i = 0; i <= cfi.length; i++) {
      if (i < cfi.length) {
        cur = cfi[i];
      } else {
        cur = '';
      }
      if (cur === '^' && !escape) {
        escape = true;
        continue;
      }

      if (state === '/') {
        if (cur.match(isNumber)) {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
          escape = false;
          continue;
        } else {
          if (f) {
            // @ts-ignore
            o.nodeIndex = parseInt(f);
            f = null;
          }
          prevState = state;
          state = null;
        }
      }

      if (state === ':') {
        if (cur.match(isNumber)) {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
          escape = false;
          continue;
        } else {
          if (f) {
            // @ts-ignore
            o.offset = parseInt(f);
            f = null;
          }
          prevState = state;
          state = null;
        }
      }

      if (state === '@') {
        let done = false;
        if (cur.match(isNumber) || cur === '.' || cur === ':') {
          if (cur === ':') {
            if (!seenColon) {
              seenColon = true;
            } else {
              done = true;
            }
          }
        } else {
          done = true;
        }
        if (!done) {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
          escape = false;
          continue;
        } else {
          prevState = state;
          state = null;
          // @ts-ignore
          if (f && seenColon) o.spatial = this.parseSpatialRange(f);
          f = null;
        }
      }

      if (state === '~') {
        if (cur.match(isNumber) || cur === '.') {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
          escape = false;
          continue;
        } else {
          if (f) {
            // @ts-ignore
            o.temporal = parseFloat(f);
          }
          prevState = state;
          state = null;
          f = null;
        }
      }

      if (!state) {
        if (cur === '!') {
          i++;
          state = cur;
          break;
        }

        if (cur === ',') {
          break;
        }

        if (cur === '/') {
          if (seenSlash) {
            break;
          } else {
            seenSlash = true;
            prevState = state;
            state = cur;
            escape = false;
            continue;
          }
        }

        if (cur === ':' || cur === '~' || cur === '@') {
          // @ts-ignore
          if (this.opts.stricter) {
            // We've already had a temporal or spatial indicator
            // and offset does not make sense and the same time
            // @ts-ignore
            if (cur === ':' && (typeof o.temporal !== 'undefined' || typeof o.spatial !== 'undefined')) {
              break;
            }
            // We've already had an offset
            // and temporal or spatial do not make sense at the same time
            // @ts-ignore
            if ((cur === '~' || cur === '@') && (typeof o.offset !== 'undefined')) {
              break;
            }
          }
          prevState = state;
          state = cur;
          escape = false;
          seenColon = false; // only relevant for '@'
          continue;
        }

        if (cur === '[' && !escape && prevState === ':') {
          prevState = state;
          state = '[';
          escape = false;
          continue;
        }

        if (cur === '[' && !escape && prevState === '/') {
          prevState = state;
          state = 'nodeID';
          escape = false;
          continue;
        }
      }


      if (state === '[') {
        if (cur === ']' && !escape) {
          prevState = state;
          state = null;
          this.parseSideBias(o, f);
          f = null;
        } else if (cur === ',' && !escape) {
          // @ts-ignore
          o.textLocationAssertion = {};
          if (f) {
            // @ts-ignore
            o.textLocationAssertion.pre = f;
          }
          f = null;
        } else {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
        }
        escape = false;
        continue;
      }

      if (state === 'nodeID') {
        if (cur === ']' && !escape) {
          prevState = state;
          state = null;
          // @ts-ignore
          o.nodeID = f;
          f = null;
        } else {
          if (!f) {
            f = cur;
          } else {
            f += cur;
          }
        }
        escape = false;
        continue;
      }

      escape = false;
    }

    // @ts-ignore
    if (!o.nodeIndex && o.nodeIndex !== 0) throw new Error("Missing child node index in CFI");

    return { parsed: o, offset: i, newDoc: (state === '!') };
  }

  // The CFI counts child nodes differently from the DOM
  // Retrieve the child of parentNode at the specified index
  // according to the CFI standard way of counting
  getChildNodeByCFIIndex(dom: Document, parentNode: Element, index: number, offset: number) {
    // console.log(`getChildNodeByCFIIndex`, { parentNode, index, offset })
    const children = parentNode.childNodes;
    if (!children.length) return { node: parentNode, offset: 0 };

    // index is pointing to the virtual node before the first node
    // as defined in the CFI spec
    if (index <= 0) {
      return { node: children[0], relativeToNode: 'before', offset: 0 }
    }

    var cfiCount = 0;
    var lastChild;
    var i, child;

    // console.log(children, children.length)
    for (i = 0; i < children.length; i++) {
      child = children[i];
      // @ts-ignore
      switch (child.nodeType) {
        case ELEMENT_NODE:

          // If the previous node was also an element node
          // then we have to pretend there was a text node in between
          // the current and previous nodes (according to the CFI spec)
          // so we increment cfiCount by two
          if (cfiCount % 2 === 0) {
            cfiCount += 2;
            if (cfiCount >= index) {
              // @ts-ignore
              if (child.tagName.toLowerCase() === 'img' && offset) {
                return { node: child, offset }
              }
              return { node: child, offset: 0 }
            }
          } else { // Previous node was a text node
            cfiCount += 1;
            if (cfiCount === index) {
              // @ts-ignore
              if (child.tagName.toLowerCase() === 'img' && offset) {
                return { node: child, offset }
              }

              return { node: child, offset: 0 }

              // This happens when offset into the previous text node was greater
              // than the number of characters in that text node
              // So we return a position at the end of the previous text node
            } else if (cfiCount > index) {
              if (!lastChild) {
                return { node: parentNode, offset: 0 };
              }
              // @ts-ignore
              return { node: lastChild, offset: this.trueLength(dom, lastChild.textContent) };
            }
          }
          lastChild = child;
          break;
        case TEXT_NODE:
        case CDATA_SECTION_NODE:
          // console.log('TEXT')
          // If this is the first node or the previous node was an element node
          if (cfiCount === 0 || cfiCount % 2 === 0) {
            cfiCount += 1;
          } else {
            // If previous node was a text node then they should be combined
            // so we count them as one, meaning we don't increment the count
          }

          if (cfiCount === index) {
            // If offset is greater than the length of the current text node
            // then we assume that the next node will also be a text node
            // and that we'll be combining them with the current node
            // @ts-ignore
            let trueLength = this.trueLength(dom, child.textContent);

            if (offset >= trueLength) {
              offset -= trueLength;
            } else {
              return { node: child, offset: offset }
            }
          }
          lastChild = child;
          break;
        default:
          continue
      }
    }

    // console.log(lastChild, index, cfiCount)

    // index is pointing to the virtual node after the last child
    // as defined in the CFI spec
    if (index > cfiCount) {
      var o = { relativeToNode: 'after', offset: 0 };
      if (!lastChild) {
        // @ts-ignore
        o.node = parentNode;
      } else {
        // @ts-ignore
        o.node = lastChild;
      }
      // @ts-ignore
      if (this.isTextNode(o.node)) {
        // @ts-ignore
        o.offset = this.trueLength(dom, o.node.textContent.length);
      }
      return o;
    }
  }

  isTextNode(node: Element) {
    if (!node) return false;
    if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE) {
      return true;
    }
    return false;
  }

  // Use a Text Location Assertion to correct and offset
  correctOffset(dom: Document, node: Element, offset: number, assertion: any) {
    var curNode = node;

    if (typeof assertion === 'string') {
      var matchStr = this.decodeEntities(dom, assertion);
    } else {
      assertion.pre = this.decodeEntities(dom, assertion.pre);
      assertion.post = this.decodeEntities(dom, assertion.post);
      var matchStr = assertion.pre + '.' + assertion.post;
    }

    if (!(this.isTextNode(node))) {
      return { node, offset: 0 };
    }

    // @ts-ignore
    while (this.isTextNode(curNode.previousSibling)) {
      // @ts-ignore
      curNode = curNode.previousSibling;
    }

    const startNode = curNode;
    var str;
    const nodeLengths = [];
    var txt = '';
    var i = 0;
    while (this.isTextNode(curNode)) {

      // @ts-ignore
      str = this.decodeEntities(dom, curNode.textContent);
      nodeLengths[i] = str.length;
      txt += str;

      if (!curNode.nextSibling) break;
      // @ts-ignore
      curNode = curNode.nextSibling;
      i++;
    }

    // Find all matches to the Text Location Assertion
    const matchOffset = (assertion.pre) ? assertion.pre.length : 0;
    const m = matchAll(txt, new RegExp(matchStr), matchOffset);
    if (!m.length) return { node, offset };

    // Get the match that has the closest offset to the existing offset
    var newOffset = closest(m, offset);

    if (curNode === node && newOffset === offset) {
      return { node, offset };
    }

    i = 0;
    curNode = startNode;
    // @ts-ignore
    while (newOffset >= nodeLengths[i]) {

      // @ts-ignore
      newOffset -= nodeLengths[i];
      if (newOffset < 0) return { node, offset }

      // @ts-ignore
      if (!curNode.nextSibling || i + 1 >= nodeOffsets.length) return { node, offset }
      i++;
      // @ts-ignore
      curNode = curNode.nextSibling;
    }

    return { node: curNode, offset: newOffset };
  }

  resolveNode(index: number, subparts: { nodeIndex: number, nodeID?: string, offset?: number }[], dom: Document, opts: {}) {
    opts = Object.assign({}, opts || {});
    if (!dom) throw new Error("Missing DOM argument");

    // Traverse backwards until a subpart with a valid ID is found
    // or the first subpart is reached
    var startNode;
    if (index === 0) {
      startNode = dom.querySelector('package');
    }

    if (!startNode) {
      for (let n of dom.childNodes) {
        if (n.nodeType === ELEMENT_NODE) {
          // if (n.nodeType === Node.DOCUMENT_NODE) {
          startNode = n;
          break;
        }
      }
    }

    // custom
    startNode = dom

    // debugger
    if (!startNode) throw new Error("Document incompatible with CFIs");

    var node = startNode;
    var startFrom = 0;
    var i;
    let subpart: typeof subparts[number] | undefined;
    for (i = subparts.length - 1; i >= 0; i--) {
      subpart = subparts[i];
      // @ts-ignore
      if (!opts.ignoreIDs && subpart.nodeID && (node = dom.getElementById(subpart.nodeID))) {
        startFrom = i + 1;
        break;
      }
    }

    // console.log(startNode, startFrom)

    if (!node) {
      node = startNode;
    }

    var o = { node, offset: 0 };

    var nodeIndex;
    for (i = startFrom; i < subparts.length; i++) {
      subpart = subparts[i];

      if (subpart) {
        // console.log(o, dom, o.node, subpart.nodeIndex, subpart.offset)
        // @ts-ignore
        o = this.getChildNodeByCFIIndex(dom, o.node, subpart.nodeIndex, subpart.offset);

        // @ts-ignore
        if (subpart.textLocationAssertion) {
          // console.log(subparts, subpart, o)
          // @ts-ignore
          o = this.correctOffset(dom, o.node, subpart.offset, subpart.textLocationAssertion);
        }
      }
    }

    return o;
  }

  // Each part of a CFI (as separated by '!')
  // references a separate HTML/XHTML/XML document.
  // This function takes an index specifying the part
  // of the CFI and the appropriate Document or XMLDocument
  // that is referenced by the specified part of the CFI
  // and returns the URI for the document referenced by
  // the next part of the CFI
  // If the opt `ignoreIDs` is true then IDs
  // will not be used while resolving
  resolveURI(index: number, dom: Document, opts: { ignoreIDs?: boolean }) {
    opts = opts || {};
    if (index < 0 || index > this.parts.length - 2) {
      throw new Error("index is out of bounds");
    }

    const subparts = this.parts[index];
    if (!subparts) throw new Error("Missing CFI part for index: " + index);

    // @ts-ignore
    var o = this.resolveNode(index, subparts, dom, opts);
    // debugger
    var node = o.node;

    // @ts-ignore
    const tagName = node.tagName.toLowerCase();
    if (tagName === 'itemref'
      // @ts-ignore
      && node.parentNode.tagName.toLowerCase() === 'spine') {
      // @ts-ignore
      const idref = node.getAttribute('idref');
      if (!idref) throw new Error("Referenced node had not 'idref' attribute");
      // @ts-ignore
      node = dom.getElementById(idref);
      if (!node) throw new Error("Specified node is missing from manifest");
      // @ts-ignore
      const href = node.getAttribute('href');
      if (!href) throw new Error("Manifest item is missing href attribute");

      return href;
    }

    if (tagName === 'iframe' || tagName === 'embed') {
      // @ts-ignore
      const src = node.getAttribute('src');
      if (!src) throw new Error(tagName + " element is missing 'src' attribute");
      return src;
    }

    if (tagName === 'object') {
      // @ts-ignore
      const data = node.getAttribute('data');
      if (!data) throw new Error(tagName + " element is missing 'data' attribute");
      return data;
    }

    if (tagName === 'image' || tagName === 'use') {
      // @ts-ignore
      const href = node.getAttribute('xlink:href');
      if (!href) throw new Error(tagName + " element is missing 'xlink:href' attribute");
      return href;
    }

    throw new Error("No URI found");
  }

  deepClone(o: any) {
    return JSON.parse(JSON.stringify(o));
  }

  resolveLocation(dom: Document, parts: {}[]) {
    const index = parts.length - 1;
    const subparts = parts[index];
    if (!subparts) throw new Error("Missing CFI part for index: " + index);

    // @ts-ignore
    var o = this.resolveNode(index, subparts, dom);

    // @ts-ignore
    var lastPart = this.deepClone(subparts[subparts.length - 1]);

    delete lastPart.nodeIndex;
    // @ts-ignore
    if (!lastPart.offset) delete o.offset;

    return { ...lastPart, ...o }
  }

  // Takes the Document or XMLDocument for the final
  // document referenced by the CFI
  // and returns the node and offset into that node
  resolveLast(dom: Document, opts: {}): string | {} {
    opts = Object.assign({
      range: false
    }, opts || {});

    if (!this.isRange) {
      return this.resolveLocation(dom, this.parts);
    }

    // @ts-ignore
    if (opts.range) {
      const range = dom.createRange();
      const from = this.getFrom();
      if (from.relativeToNode === 'before') {
        // @ts-ignore
        range.setStartBefore(from.node, from.offset)
      } else if (from.relativeToNode === 'after') {
        // @ts-ignore
        range.setStartAfter(from.node, from.offset)
      } else {
        range.setStart(from.node, from.offset);
      }

      const to = this.getTo();
      if (to.relativeToNode === 'before') {
        // @ts-ignore
        range.setEndBefore(to.node, to.offset)
      } else if (to.relativeToNode === 'after') {
        // @ts-ignore
        range.setEndAfter(to.node, to.offset)
      } else {
        range.setEnd(to.node, to.offset);
      }

      return range;
    }

    return {
      from: this.resolveLocation(dom, this.getFrom()),
      to: this.resolveLocation(dom, this.getTo()),
      isRange: true
    };
  }

  resolve(doc: Document, opts: {}): { node: Node } | { node?: undefined } {
    // @ts-ignore
    return this.resolveLast(doc, opts);
  }
}

export {
  CFI
}

export const extractObokuMetadataFromCfi = (cfi: string): {
  cleanedCfi: string,
  itemId?: string
} => {
  let isNotACollection = false
  let tags: string[] = []
  let isIgnored = false
  let direction = undefined
  let isbn = undefined

  // epubcfi(/2/4/2[_preface]/2/1|[oboku:id-id2632344]) -> |[oboku:id-id2632344]
  const directives = cfi.match(/(\|\[oboku\:[^\]]*\])+/ig)?.map(str =>
    str.replace(/\|\[oboku:/, '')
      .replace(/\]/, '')
  ) || []
  const itemId = directives[0]
  const cleanedCfi = cfi.replace(/\|\[oboku:[^\]]*]/, '')

  // console.log(directives)

  return {
    cleanedCfi,
    itemId
  }
}