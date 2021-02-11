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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFn = exports.addLinkToBook = exports.getOrCreateTagFromName = exports.addTagsFromNameToBook = exports.addTagsToBook = exports.createBook = exports.find = exports.findOne = exports.insert = exports.atomicUpdate = exports.auth = exports.createUser = void 0;
const shared_1 = require("@oboku/shared");
const utils_1 = require("../utils");
const couchDbEntities_1 = require("./couchDbEntities");
const createUser = (db, username, userpass) => __awaiter(void 0, void 0, void 0, function* () {
    const obokuDb = db.use('_users');
    const newUser = new couchDbEntities_1.User(`org.couchdb.user:${username}`, username, userpass, '');
    yield obokuDb.insert(newUser, newUser._id);
});
exports.createUser = createUser;
const auth = (db, username, userpass) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield db.auth(username, userpass);
        if (!response.ok || !response.name) {
            return null;
        }
        return response;
    }
    catch (e) {
        if (e.statusCode === 401)
            return null;
        throw e;
    }
});
exports.auth = auth;
function atomicUpdate(db, rxModel, id, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.retryFn(() => __awaiter(this, void 0, void 0, function* () {
            const doc = (yield db.get(id));
            const _a = cb(doc), { rx_model } = _a, rest = __rest(_a, ["rx_model"]);
            if (rxModel !== doc.rx_model)
                throw new Error('Invalid document type');
            return yield db.insert(Object.assign(Object.assign({}, rest), { rx_model, _rev: doc._rev, _id: doc._id }));
        }));
    });
}
exports.atomicUpdate = atomicUpdate;
const insert = (db, rxModel, data) => __awaiter(void 0, void 0, void 0, function* () {
    const dinalData = Object.assign(Object.assign({}, data), { rx_model: rxModel });
    const doc = yield db.insert(dinalData);
    if (!doc.ok)
        throw new Error('Unable to create docuemnt');
    return doc;
});
exports.insert = insert;
const findOne = (db, rxModel, query) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield exports.retryFn(() => db.find(Object.assign(Object.assign({}, query), { selector: Object.assign({ rx_model: rxModel }, query === null || query === void 0 ? void 0 : query.selector), limit: 1 })));
    if (response.docs.length === 0)
        return null;
    const doc = response.docs[0];
    if (rxModel !== doc.rx_model)
        throw new Error(`Invalid document type`);
    return doc;
});
exports.findOne = findOne;
const find = (db, rxModel, query) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield exports.retryFn(() => db.find(Object.assign(Object.assign({}, query), { selector: Object.assign({ rx_model: rxModel }, query === null || query === void 0 ? void 0 : query.selector), limit: 1 })));
    return response.docs;
});
exports.find = find;
const createBook = (db, data = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const insertData = {
        collections: [],
        createdAt: new Date().getTime(),
        creator: null,
        date: null,
        lang: null,
        lastMetadataUpdatedAt: null,
        links: [],
        publisher: null,
        readingStateCurrentBookmarkLocation: null,
        readingStateCurrentBookmarkProgressPercent: 0,
        readingStateCurrentBookmarkProgressUpdatedAt: null,
        readingStateCurrentState: shared_1.ReadingStateState.NotStarted,
        rights: null,
        rx_model: 'book',
        subject: null,
        tags: [],
        title: null,
        modifiedAt: null,
    };
    return exports.insert(db, 'book', Object.assign(Object.assign({}, insertData), data));
});
exports.createBook = createBook;
const addTagsToBook = (db, bookId, tagIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (tagIds.length === 0)
        return;
    return Promise.all([
        atomicUpdate(db, 'book', bookId, old => (Object.assign(Object.assign({}, old), { tags: [...old.tags.filter(tag => !tagIds.includes(tag)), ...tagIds] }))),
        ...tagIds.map(tagId => atomicUpdate(db, 'tag', tagId, old => (Object.assign(Object.assign({}, old), { books: [...old.books.filter(id => id !== bookId), bookId] }))))
    ]);
});
exports.addTagsToBook = addTagsToBook;
const addTagsFromNameToBook = (db, bookId, tagNames) => __awaiter(void 0, void 0, void 0, function* () {
    if (tagNames.length === 0)
        return;
    // Get all tag ids and create one if it does not exist
    const tagIds = yield Promise.all(tagNames.map((name) => __awaiter(void 0, void 0, void 0, function* () { return exports.getOrCreateTagFromName(db, name); })));
    return yield exports.addTagsToBook(db, bookId, tagIds);
});
exports.addTagsFromNameToBook = addTagsFromNameToBook;
const getOrCreateTagFromName = (db, name) => {
    return exports.retryFn(() => __awaiter(void 0, void 0, void 0, function* () {
        // Get all tag ids and create one if it does not exist
        const existingTag = yield exports.findOne(db, 'tag', { selector: { name } });
        if (existingTag) {
            return existingTag._id;
        }
        const insertedTag = yield exports.insert(db, 'tag', {
            isProtected: false,
            books: [],
            name,
            createdAt: new Date().toISOString(),
            modifiedAt: null,
        });
        return insertedTag.id;
    }));
};
exports.getOrCreateTagFromName = getOrCreateTagFromName;
const addLinkToBook = (db, bookId, linkId) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all([
        atomicUpdate(db, 'book', bookId, old => (Object.assign(Object.assign({}, old), { links: [...old.links.filter(id => id !== linkId), linkId] }))),
        atomicUpdate(db, 'link', linkId, old => (Object.assign(Object.assign({}, old), { book: bookId })))
    ]);
});
exports.addLinkToBook = addLinkToBook;
const retryFn = (fn, retry = 100) => __awaiter(void 0, void 0, void 0, function* () {
    let currentRetry = retry;
    const retryable = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield fn();
        }
        catch (e) {
            if ((e.statusCode >= 500 || e.statusCode === 409) && currentRetry > 0) {
                yield utils_1.waitForRandomTime(1, 200);
                currentRetry--;
                return yield retryable();
            }
            throw e;
        }
    });
    return yield retryable();
});
exports.retryFn = retryFn;
//# sourceMappingURL=helpers.js.map