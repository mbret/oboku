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
exports.sync = void 0;
const ramda_1 = require("ramda");
const Logger_1 = require("../Logger");
const logger = Logger_1.Logger.namespace('sync');
function isFolder(item) {
    return item.type === 'folder';
}
function isFile(item) {
    return item.type === 'file';
}
const sync = (synchronizable, ctx, helpers) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`dataSourcesSync run for user ${ctx.userEmail} with dataSource ${ctx.dataSourceId}`);
    yield syncFolder({ ctx, helpers, item: synchronizable, hasCollectionAsParent: false, lvl: 0, parents: [] });
});
exports.sync = sync;
const syncFolder = ({ ctx, helpers, hasCollectionAsParent, item, lvl, parents }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const metadataForFolder = helpers.extractMetadataFromName(item.name);
    logger.log(`syncFolder metadata for ${item.name}`, metadataForFolder);
    const isCollection = isFolder(item) && !hasCollectionAsParent && lvl > 0 && !metadataForFolder.isNotACollection;
    if (metadataForFolder.isIgnored) {
        logger.log(`syncFolder ignore ${item.name}`);
        return;
    }
    yield Promise.all(metadataForFolder.tags.map(name => helpers.getOrcreateTagFromName(name)));
    // Do not regsiter as collection if
    // - root
    // - metadata says otherwise
    // - parent is not already a collection
    if (isFolder(item) && isCollection) {
        yield registerOrUpdateCollection({ ctx, item, helpers });
    }
    logger.log(`syncFolder ${item.name} with items ${((_a = item.items) === null || _a === void 0 ? void 0 : _a.length) || 0} items`, item);
    yield Promise.all((item.items || []).map((subItem) => __awaiter(void 0, void 0, void 0, function* () {
        if (isFile(subItem)) {
            yield createOrUpdateBook({
                ctx,
                item: subItem,
                helpers,
                parents: [...parents, item],
            });
        }
        else if (isFolder(subItem)) {
            yield syncFolder({
                ctx,
                helpers,
                lvl: lvl + 1,
                hasCollectionAsParent: isCollection,
                item: subItem,
                parents: [...parents, item],
            });
        }
    })));
});
const createOrUpdateBook = ({ ctx: { dataSourceType }, helpers, parents, item }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parentTags = parents.reduce((tags, parent) => [...tags, ...helpers.extractMetadataFromName(parent.name).tags], []);
        const metadata = helpers.extractMetadataFromName(item.name);
        const parentFolders = parents.filter(parent => isFolder(parent));
        const existingLink = yield helpers.findOne('link', { selector: { resourceId: item.resourceId } });
        let existingBook = null;
        if (existingLink === null || existingLink === void 0 ? void 0 : existingLink.book) {
            existingBook = yield helpers.findOne('book', { selector: { _id: existingLink.book } });
        }
        if (!existingLink || !existingBook) {
            let bookId = existingBook === null || existingBook === void 0 ? void 0 : existingBook._id;
            if (!bookId) {
                logger.log(`createOrUpdateBook new file ${item.name} detected`);
                const insertedBook = yield helpers.createBook({
                    title: item.name
                });
                bookId = insertedBook.id;
            }
            const insertedLink = yield helpers.create('link', {
                type: dataSourceType,
                resourceId: item.resourceId,
                book: bookId,
                data: JSON.stringify({}),
                createdAt: new Date().toISOString(),
                modifiedAt: null,
            });
            yield helpers.addLinkToBook(bookId, insertedLink.id);
            yield helpers.addTagsFromNameToBook(bookId, [...metadata.tags, ...parentTags]);
            yield synchronizeBookWithParentCollections(bookId, parentFolders, helpers);
            helpers.refreshBookMetadata({ bookId: bookId }).catch(logger.error);
        }
        else {
            /**
             * We already have a link that exist for this datasource with this book.
             * We will try to retrieve the book and update it if needed.
             */
            // We check the last updated date of the book
            const lastMetadataUpdatedAt = new Date((existingBook === null || existingBook === void 0 ? void 0 : existingBook.lastMetadataUpdatedAt) || 0);
            if (lastMetadataUpdatedAt < new Date(item.modifiedAt || 0) || !(yield helpers.isBookCoverExist(existingBook._id))) {
                // console.log(`dataSourcesSync book file ${item.resourceId} has a more recent modifiedTime ${item.modifiedAt} than its lastMetadataUpdatedAt ${lastMetadataUpdatedAt}, triggering metadata refresh`)
                helpers.refreshBookMetadata({ bookId: existingBook === null || existingBook === void 0 ? void 0 : existingBook._id }).catch(logger.error);
            }
            else {
                logger.log(`book ${existingLink.book} has no changes detected, skip metadata refresh`);
            }
            yield synchronizeBookWithParentCollections(existingBook._id, parentFolders, helpers);
            yield helpers.addTagsFromNameToBook(existingBook._id, [...metadata.tags, ...parentTags]);
            // Finally we update the tags to the book if needed
            const { applyTags } = yield helpers.getDataSourceData();
            yield helpers.addTagsToBook(existingBook._id, applyTags || []);
        }
    }
    catch (e) {
        logger.error(`createOrUpdateBook something went wrong for book ${item.name} (${item.resourceId})`);
        logger.error(e);
        throw e;
    }
});
/**
 * For every parents of the book we will lookup if there are collections that exist without
 * referencing it. If so then we will attach the collection and the book together
 */
const synchronizeBookWithParentCollections = (bookId, parents, helpers) => __awaiter(void 0, void 0, void 0, function* () {
    const parentResourceIds = (parents === null || parents === void 0 ? void 0 : parents.map(parent => parent.resourceId)) || [];
    logger.log(`synchronizeBookWithParentCollections between ${bookId} and`, parentResourceIds);
    // Retrieve all the new collection to which attach the book and add the book in the list
    const collectionsThatHaveNotThisBookAsReferenceYet = yield helpers.find('obokucollection', {
        selector: {
            $or: parentResourceIds.map(resourceId => ({ resourceId })),
            books: {
                $nin: [bookId]
            }
        }
    });
    if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
        logger.log(`synchronizeBookWithParentCollections ${bookId} has ${collectionsThatHaveNotThisBookAsReferenceYet.length} collection missing its reference`);
        yield Promise.all(collectionsThatHaveNotThisBookAsReferenceYet
            .map(collection => helpers.atomicUpdate('obokucollection', collection._id, old => (Object.assign(Object.assign({}, old), { books: [...old.books.filter(id => id !== bookId), bookId] })))));
    }
    // Retrieve all the collections that has the book attached but are not a parent anymore
    // @todo only retrieve collections that are from the sync folder
    // const collectionsThatShouldNotBeAttachedToBookAnymore = await helpers.find('obokucollection', {
    //   selector: {
    //     resourceId: {
    //       $nin: parentResourceIds,
    //     },
    //     books: {
    //       $in: [bookId]
    //     }
    //   }
    // })
    // if (collectionsThatShouldNotBeAttachedToBookAnymore.length > 0) {
    //   logger.log(`synchronizeBookWithParentCollections ${bookId} has ${collectionsThatShouldNotBeAttachedToBookAnymore.length} collection which should not reference it`)
    // }
    // await Promise.all(
    //   collectionsThatShouldNotBeAttachedToBookAnymore
    //     .map(collection =>
    //       helpers.atomicUpdate('obokucollection', collection._id, old => ({
    //         ...old,
    //         books: [...old.books.filter(id => id !== bookId)]
    //       }))
    //     )
    // )
    // Attach the new parents to the book
    const collectionIds = yield helpers.find('obokucollection', {
        selector: {
            $or: parentResourceIds.map(resourceId => ({ resourceId })),
        }
    });
    yield helpers.atomicUpdate('book', bookId, old => (Object.assign(Object.assign({}, old), { collections: collectionIds.map(({ _id }) => _id) })));
});
const registerOrUpdateCollection = ({ item: { name, resourceId }, helpers, ctx }) => __awaiter(void 0, void 0, void 0, function* () {
    logger.log(`registerOrUpdateCollection ${name} (${resourceId})`);
    let collectionId;
    /**
     * Try to get existing collection by same resource id
     * If there is one we just update the folder name in case of
     */
    const sameCollectionByResourceId = yield helpers.findOne('obokucollection', { selector: { resourceId, } });
    if (sameCollectionByResourceId) {
        collectionId = sameCollectionByResourceId._id;
        if (sameCollectionByResourceId.name !== name) {
            yield helpers.atomicUpdate('obokucollection', sameCollectionByResourceId._id, old => (Object.assign(Object.assign({}, old), { name })));
        }
    }
    else {
        /**
         * Otherwise we just create a new collection with this resource id
         * Note that there could be another collection with same name. But since it
         * does not come from the same datasource it should still be treated as different
         */
        const created = yield helpers.create('obokucollection', {
            name,
            resourceId,
            books: [],
            createdAt: new Date().toISOString(),
            modifiedAt: null,
        });
        collectionId = created.id;
    }
    // try to remove book that does not exist anymore if needed
    const collection = yield helpers.findOne('obokucollection', { selector: { _id: collectionId } });
    if (collection) {
        const booksInCollection = yield helpers.find('book', { selector: { _id: { $in: (collection === null || collection === void 0 ? void 0 : collection.books) || [] } } });
        const booksInCollectionAsIds = booksInCollection.map(({ _id }) => _id);
        const toRemove = ramda_1.difference(collection.books, booksInCollectionAsIds);
        if (toRemove.length > 0)
            yield helpers.atomicUpdate('obokucollection', collection === null || collection === void 0 ? void 0 : collection._id, old => (Object.assign(Object.assign({}, old), { books: old.books.filter(id => !toRemove.includes(id)) })));
    }
});
//# sourceMappingURL=sync.js.map