import xmldoc, { XmlElement } from 'xmldoc'
import { Archive, Manifest } from '../types'

const extractNavChapter = (li: XmlElement, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  const chp: Manifest['nav']['toc'][number] = {
    contents: [],
    path: ``,
    href: ``,
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
    chp.path = opfBasePath ? `${opfBasePath}/${contentNode.attr.href}` : `${contentNode.attr.href}`
    chp.href = opfBasePath ? `${baseUrl}/${opfBasePath}/${contentNode.attr.href}` : `${baseUrl}/${contentNode.attr.href}`
  }
  const sublistNode = li.childNamed('ol');
  if (sublistNode) {
    const children = sublistNode.childrenNamed('li');
    if (children && children.length > 0) {
      chp.contents = children.map((child) => extractNavChapter(child, { opfBasePath, baseUrl }));
    }
  }

  return chp;
};

const buildTOCFromNav = (doc: xmldoc.XmlDocument, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  const toc: Manifest['nav']['toc'] = [];

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
      .forEach((li) => toc.push(extractNavChapter(li as XmlElement, { opfBasePath, baseUrl })));
  }

  return toc;
};

const parseTocFromNavPath = async (opfXmlDoc: xmldoc.XmlDocument, archive: Archive, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  // Try to detect if there is a nav item
  const navItem = opfXmlDoc.childNamed('manifest')?.childrenNamed('item')
    .find((child) => child.attr.properties === 'nav');

  if (navItem) {
    const tocFile = Object.values(archive.files).find(item => item.name.endsWith(navItem.attr.href || ''))
    if (tocFile) {
      const doc = new xmldoc.XmlDocument(await tocFile.string())
      return buildTOCFromNav(doc, { opfBasePath, baseUrl })
    }
  }
}

const extractNcxChapter = (point: xmldoc.XmlElement, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  const src = point?.childNamed('content')?.attr.src || ''
  const out: Manifest['nav']['toc'][number] = {
    title: point?.descendantWithPath('navLabel.text')?.val || '',
    path: opfBasePath ? `${opfBasePath}/${src}` : `${src}`,
    href: opfBasePath ? `${baseUrl}/${opfBasePath}/${src}` : `${baseUrl}/${src}`,
    contents: []
  };
  const children = point.childrenNamed('navPoint');
  if (children && children.length > 0) {
    out.contents = children.map((pt) => extractNcxChapter(pt, { opfBasePath, baseUrl }));
  }

  return out;
};

const buildTOCFromNCX = (ncxData: xmldoc.XmlDocument, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  const toc: Manifest['nav']['toc'] = [];

  ncxData
    .childNamed('navMap')
    ?.childrenNamed('navPoint')
    .forEach((point) => toc.push(extractNcxChapter(point, { opfBasePath, baseUrl })));

  return toc;
};

const parseTocFromNcx = async ({ opfData, opfBasePath, baseUrl, archive }: {
  opfData: xmldoc.XmlDocument,
  opfBasePath: string,
  archive: Archive,
  baseUrl: string
}) => {
  const spine = opfData.childNamed('spine');
  const ncxId = spine && spine.attr.toc;

  if (ncxId) {
    const ncxItem = opfData
      .childNamed('manifest')
      ?.childrenNamed('item')
      .find((item) => item.attr.id === ncxId);

    if (ncxItem) {
      const ncxPath = `${opfBasePath}${opfBasePath === '' ? '' : '/'}${ncxItem.attr.href}`;

      const file = Object.values(archive.files).find(item => item.name.endsWith(ncxPath))
      if (file) {
        const ncxData = new xmldoc.XmlDocument(await file.string())

        return buildTOCFromNCX(ncxData, { opfBasePath, baseUrl })
      }
    }

  }
};

export const parseToc = async (opfXmlDoc: xmldoc.XmlDocument, archive: Archive, { opfBasePath, baseUrl }: { opfBasePath: string, baseUrl: string }) => {
  const tocFromNcx = await parseTocFromNcx({ opfData: opfXmlDoc, opfBasePath, archive, baseUrl })

  if (tocFromNcx) {
    return tocFromNcx
  }

  return await parseTocFromNavPath(opfXmlDoc, archive, { opfBasePath, baseUrl })
}