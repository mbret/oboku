"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadataFromName = exports.createHelpers = void 0;
const helpers_1 = require("@oboku/api-shared/src/db/helpers");
const shared_1 = require("@oboku/shared");
const createHelpers = (dataSourceId, refreshBookMetadata, db, getBookCover, userId) => {
    const helpers = {
        refreshBookMetadata: (opts) => refreshBookMetadata(opts).catch(console.error),
        getDataSourceData: () => __awaiter(void 0, void 0, void 0, function* () {
            const dataSource = yield helpers_1.findOne(db, 'datasource', { selector: { _id: dataSourceId } });
            let data = {};
            try {
                if (dataSource === null || dataSource === void 0 ? void 0 : dataSource.data) {
                    data = JSON.parse(dataSource === null || dataSource === void 0 ? void 0 : dataSource.data);
                }
            }
            catch (e) { }
            return data;
        }),
        isBookCoverExist: (bookId) => __awaiter(void 0, void 0, void 0, function* () { return getBookCover({ coverId: `${userId}-${bookId}` }); }),
        createBook: (data) => helpers_1.createBook(db, data),
        findOne: (model, query) => helpers_1.findOne(db, model, query),
        find: (model, query) => helpers_1.find(db, model, query),
        atomicUpdate: (model, id, cb) => helpers_1.atomicUpdate(db, model, id, cb),
        create: (model, data) => helpers_1.insert(db, model, data),
        addTagsToBook: (bookId, tagIds) => helpers_1.addTagsToBook(db, bookId, tagIds),
        addTagsFromNameToBook: (bookId, tagNames) => helpers_1.addTagsFromNameToBook(db, bookId, tagNames),
        getOrcreateTagFromName: (name) => helpers_1.getOrCreateTagFromName(db, name),
        addLinkToBook: (bookId, linkId) => helpers_1.addLinkToBook(db, bookId, linkId),
        createError: (code = 'unknown', previousError) => {
            switch (code) {
                case 'unauthorized':
                    return new shared_1.ObokuSharedError(shared_1.Errors.ERROR_DATASOURCE_UNAUTHORIZED, previousError);
                default:
                    return new shared_1.ObokuSharedError(shared_1.Errors.ERROR_DATASOURCE_UNKNOWN, previousError);
            }
        },
        extractMetadataFromName: exports.extractMetadataFromName,
    };
    return helpers;
};
exports.createHelpers = createHelpers;
/**
* Will extract any oboku normalized metadata that exist in the resource id string.
* Use this method to enrich the content that is being synchronized
* @example
* "foo [oboku~no_collection]" -> { isCollection: false }
* "foo [oboku~tags~bar]" -> { tags: ['bar'] }
* "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
*/
const extractMetadataFromName = (resourceId) => {
    var _a;
    let isNotACollection = false;
    let tags = [];
    let isIgnored = false;
    const directives = (_a = resourceId.match(/(\[oboku\~[^\]]*\])+/ig)) === null || _a === void 0 ? void 0 : _a.map(str => str.replace(/\[oboku~/, '')
        .replace(/\]/, ''));
    directives === null || directives === void 0 ? void 0 : directives.forEach(directive => {
        var _a;
        if (directive === 'no_collection') {
            isNotACollection = true;
        }
        if (directive === 'ignore') {
            isIgnored = true;
        }
        if (directive.startsWith('tags~')) {
            const newTags = (_a = directive.replace(/\[tags\~/, '')
                .replace(/\]/, '')
                .split('~')[1]) === null || _a === void 0 ? void 0 : _a.split(',');
            tags = [...tags, ...(newTags || [])];
        }
    });
    return {
        isNotACollection,
        tags,
        isIgnored,
    };
};
exports.extractMetadataFromName = extractMetadataFromName;
//# sourceMappingURL=helpers.js.map