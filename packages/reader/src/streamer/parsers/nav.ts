import xmldoc, { XmlElement } from 'xmldoc'
import { Manifest } from '../../reader/types';

const extractNavChapter = (li: XmlElement) => {
  const chp: Manifest['nav']['toc'][number] = {
    contents: [],
    path: ``,
    title: ``,
  };
  let contentNode = li.childNamed('span') || li.childNamed('a');
  chp.title = contentNode?.attr.title || contentNode?.val.trim() || chp.title
  let node = contentNode?.name;
  if (node !== 'a') {
    contentNode = li.descendantWithPath(`${node}.a`);
    if (contentNode) {
      node = contentNode.name.toLowerCase();
    }
  }
  if (node === 'a' && contentNode?.attr.href) {
    chp.path = contentNode.attr.href;
  }
  const sublistNode = li.childNamed('ol');
  if (sublistNode) {
    const children = sublistNode.childrenNamed('li');
    if (children && children.length > 0) {
      chp.contents = children.map((child) => extractNavChapter(child));
    }
  }

  return chp;
};

export const buildTOCFromNav = (doc: xmldoc.XmlDocument) => {
  const toc: any[] = [];

  let navDataChildren;
  if (doc.descendantWithPath('body.nav.ol')) {
    navDataChildren = doc.descendantWithPath('body.nav.ol')?.children;
  } else if (doc.descendantWithPath('body.section.nav.ol')) {
    navDataChildren = doc.descendantWithPath('body.section.nav.ol')?.children;
  }

  // console.log(navDataChildren)

  if (navDataChildren && navDataChildren.length > 0) {
    navDataChildren
      .filter((li) => (li as XmlElement).name === 'li')
      .forEach((li) => toc.push(extractNavChapter(li as XmlElement)));
  }

  return toc;
};

export const parseTocFromNavPath = (data: string) => {
  const doc = new xmldoc.XmlDocument(data)

  return buildTOCFromNav(doc)
}
