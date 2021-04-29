var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parse } from 'fast-xml-parser';
import xmldoc from 'xmldoc';
import { parseTocFromNavPath } from '../parsers/nav';
import { getArchiveOpfInfo } from '../archiveHelpers';
export const generateManifestFromEpub = (archive, baseUrl) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive);
    if (!opsFile) {
        throw new Error('No opf content');
    }
    const data = yield opsFile.string();
    const parsedData = parse(data, {
        attributeNamePrefix: "@_",
        // attrNodeName: "attr", //default is 'false'
        // textNodeName: "#text",
        ignoreAttributes: false,
        // ignoreNameSpace: false,
        // allowBooleanAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: true,
        trimValues: false,
        // cdataTagName: "__cdata", //default is 'false'
        // cdataPositionChar: "\\c",
        // parseTrueNumberOnly: false,
        arrayMode: false, //"strict"
        // attrValueProcessor: (val, attrName) => {
        //   return val
        // },
        //default is a=>a
        // tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
        // stopNodes: ["parse-me-as-string"]
    });
    const opfXmlDoc = new xmldoc.XmlDocument(data);
    // Try to detect if there is a nav item
    const navItem = (_a = opfXmlDoc.childNamed('manifest')) === null || _a === void 0 ? void 0 : _a.childrenNamed('item').find((child) => child.attr.properties === 'nav');
    let toc = [];
    if (navItem) {
        const tocFile = Object.values(archive.files).find(item => item.name.endsWith(navItem.attr.href || ''));
        if (tocFile) {
            toc = parseTocFromNavPath(yield tocFile.string());
        }
    }
    const metadata = parsedData.package.metadata;
    const meta = ((metadata === null || metadata === void 0 ? void 0 : metadata.meta) || []);
    const metaAsArray = Array.isArray(meta) ? meta : [meta];
    const defaultRenditionLayout = ((_b = metaAsArray.find((item) => item['@_property'] === `rendition:layout`)) === null || _b === void 0 ? void 0 : _b['#text']);
    const spine = parsedData.package.spine;
    // console.log(archive.files)
    const spineItemIds = parsedData.package.spine.itemref.map((item) => item['@_idref']);
    const manifestItemsFromSpine = parsedData.package.manifest.item.filter((item) => spineItemIds.includes(item['@_id']));
    const archiveSpineItems = archive.files.filter(file => manifestItemsFromSpine.find(item => `${opfBasePath}/${item['@_href']}` === file.name));
    const totalSize = archiveSpineItems.reduce((size, file) => file.size + size, 1);
    // console.log(data, manifestItemsFromSpine, archiveSpineItems)
    return {
        filename: archive.filename,
        nav: {
            toc,
        },
        renditionLayout: defaultRenditionLayout || 'reflowable',
        title: ((_c = metadata === null || metadata === void 0 ? void 0 : metadata['dc:title']) === null || _c === void 0 ? void 0 : _c['#text']) || '',
        readingDirection: spine['@_page-progression-direction'] || 'ltr',
        readingOrder: spine.itemref.map((spineItem) => {
            var _a, _b;
            const item = parsedData.package.manifest.item.find((item) => item['@_id'] === spineItem['@_idref']);
            const href = item['@_href'];
            const properties = (((_a = spineItem[`@_properties`]) === null || _a === void 0 ? void 0 : _a.split(` `)) || []);
            const itemSize = ((_b = archive.files.find(file => file.name.endsWith(href))) === null || _b === void 0 ? void 0 : _b.size) || 0;
            // console.log(item, spine, properties)
            return Object.assign(Object.assign({ id: item['@_id'], 
                // href: `${event.request.url}/${item['@_href']}`,
                path: opfBasePath ? `${opfBasePath}/${item['@_href']}` : `${item['@_href']}`, href: opfBasePath ? `${baseUrl}/${opfBasePath}/${item['@_href']}` : `${baseUrl}/${item['@_href']}`, renditionLayout: defaultRenditionLayout || `reflowable` }, properties.find(property => property === 'rendition:layout-reflowable') && {
                renditionLayout: `reflowable`,
            }), { 
                // progressionWeight: Math.floor((1 / spine.itemref.length) * 1000) / 1000,
                progressionWeight: itemSize / totalSize, size: itemSize });
        })
    };
});
export const generateManifestFromArchive = (archive, baseUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const files = Object.values(archive.files).filter(file => !file.dir);
    return {
        filename: archive.filename,
        nav: {
            toc: []
        },
        title: ``,
        renditionLayout: `pre-paginated`,
        readingDirection: 'ltr',
        readingOrder: files.map((file) => {
            const filenameWithoutExtension = file.name.substring(0, file.name.lastIndexOf(`.`));
            return {
                id: file.name,
                // path: `${file.name}.xhtml`,
                path: `${file.name}`,
                // href: `${baseUrl}/${file.name}.xhtml`,
                href: `${baseUrl}/${file.name}`,
                renditionLayout: `pre-paginated`,
                progressionWeight: (1 / files.length)
            };
        })
    };
});
export const generateManifestResponse = (archive, { baseUrl }) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive);
    if (!!opsFile) {
        const manifest = yield generateManifestFromEpub(archive, baseUrl);
        const data = JSON.stringify(manifest);
        return new Response(data, { status: 200 });
    }
    const manifest = yield generateManifestFromArchive(archive, baseUrl);
    const data = JSON.stringify(manifest);
    return new Response(data, { status: 200 });
});
//# sourceMappingURL=manifest.js.map