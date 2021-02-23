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
exports.createHelpers = void 0;
const helpers_1 = require("@oboku/api-shared/src/db/helpers");
const src_1 = require("@oboku/shared/src");
const directives_1 = require("@oboku/shared/src/directives");
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
                    return new src_1.ObokuSharedError(src_1.Errors.ERROR_DATASOURCE_UNAUTHORIZED, previousError);
                case 'rateLimitExceeded':
                    return new src_1.ObokuSharedError(src_1.Errors.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED, previousError);
                default:
                    return new src_1.ObokuSharedError(src_1.Errors.ERROR_DATASOURCE_UNKNOWN, previousError);
            }
        },
        extractMetadataFromName: directives_1.extractMetadataFromName,
    };
    return helpers;
};
exports.createHelpers = createHelpers;
//# sourceMappingURL=helpers.js.map