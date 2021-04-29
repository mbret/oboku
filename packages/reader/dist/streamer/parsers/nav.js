import xmldoc from 'xmldoc';
const extractNavChapter = (li) => {
    const chp = {
        contents: [],
        path: ``,
        title: ``,
    };
    let contentNode = li.childNamed('span') || li.childNamed('a');
    chp.title = (contentNode === null || contentNode === void 0 ? void 0 : contentNode.attr.title) || (contentNode === null || contentNode === void 0 ? void 0 : contentNode.val.trim()) || chp.title;
    let node = contentNode === null || contentNode === void 0 ? void 0 : contentNode.name;
    if (node !== 'a') {
        contentNode = li.descendantWithPath(`${node}.a`);
        if (contentNode) {
            node = contentNode.name.toLowerCase();
        }
    }
    if (node === 'a' && (contentNode === null || contentNode === void 0 ? void 0 : contentNode.attr.href)) {
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
export const buildTOCFromNav = (doc) => {
    var _a, _b;
    const toc = [];
    let navDataChildren;
    if (doc.descendantWithPath('body.nav.ol')) {
        navDataChildren = (_a = doc.descendantWithPath('body.nav.ol')) === null || _a === void 0 ? void 0 : _a.children;
    }
    else if (doc.descendantWithPath('body.section.nav.ol')) {
        navDataChildren = (_b = doc.descendantWithPath('body.section.nav.ol')) === null || _b === void 0 ? void 0 : _b.children;
    }
    // console.log(navDataChildren)
    if (navDataChildren && navDataChildren.length > 0) {
        navDataChildren
            .filter((li) => li.name === 'li')
            .forEach((li) => toc.push(extractNavChapter(li)));
    }
    return toc;
};
export const parseTocFromNavPath = (data) => {
    const doc = new xmldoc.XmlDocument(data);
    return buildTOCFromNav(doc);
};
//# sourceMappingURL=nav.js.map