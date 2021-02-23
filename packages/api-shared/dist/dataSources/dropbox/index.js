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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = void 0;
/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
const node_fetch_1 = __importDefault(require("node-fetch"));
const dropbox_1 = require("dropbox");
const stream_1 = require("stream");
const shared_1 = require("@oboku/shared");
const extractIdFromResourceId = (resourceId) => resourceId.replace(`dropbox-`, ``);
const generateResourceId = (id) => `dropbox-${id}`;
exports.dataSource = {
    /**
     * @see https://www.dropbox.com/developers/documentation/http/documentation#files-download
     */
    download: (link, credentials) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(typeof node_fetch_1.default);
        var dbx = new dropbox_1.Dropbox({ accessToken: credentials.accessToken, fetch: node_fetch_1.default });
        const fileId = extractIdFromResourceId(link.resourceId);
        const response = yield dbx.filesDownload({
            path: `${fileId}`
        });
        const results = response.result;
        // @ts-ignore
        const fileBinary = results.fileBinary || Buffer.from('', 'binary');
        const stream = new stream_1.Readable({
            read() {
                this.push(fileBinary);
                this.push(null);
            }
        });
        return {
            metadata: {
                name: '',
                size: results.size.toString()
            },
            stream
        };
    }),
    sync: ({ credentials }, helpers) => __awaiter(void 0, void 0, void 0, function* () {
        var dbx = new dropbox_1.Dropbox({ accessToken: credentials.accessToken, fetch: node_fetch_1.default });
        const { folderId } = yield helpers.getDataSourceData();
        if (!folderId) {
            throw helpers.createError('unknown');
        }
        const getContentsFromFolder = (id) => __awaiter(void 0, void 0, void 0, function* () {
            let hasMore = true;
            let cursor = undefined;
            let results = [];
            while (hasMore) {
                let response;
                if (cursor) {
                    response = yield dbx.filesListFolderContinue({
                        cursor,
                    });
                }
                else {
                    response = yield dbx.filesListFolder({
                        path: id,
                        include_deleted: false,
                        include_non_downloadable_files: false,
                        include_media_info: true,
                    });
                }
                cursor = response.result.cursor;
                results = [
                    ...results,
                    ...response.result.entries
                        .filter(entry => entry['.tag'] === 'folder'
                        || shared_1.READER_SUPPORTED_EXTENSIONS.some(extension => entry.name.endsWith(extension)))
                ];
                hasMore = response.result.has_more;
            }
            return Promise.all(results.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                if (item[".tag"] === 'file') {
                    return {
                        type: 'file',
                        resourceId: generateResourceId(item.id),
                        name: item.name,
                        modifiedAt: item.server_modified
                    };
                }
                return {
                    type: 'folder',
                    resourceId: generateResourceId(item.id),
                    items: yield getContentsFromFolder(item.id),
                    name: item.name,
                    modifiedAt: new Date().toISOString(),
                };
            })));
        });
        const [items, rootFolderResponse] = yield Promise.all([
            yield getContentsFromFolder(folderId),
            yield dbx.filesGetMetadata({
                path: folderId
            })
        ]);
        return {
            items,
            name: rootFolderResponse.result.name,
        };
    })
};
//# sourceMappingURL=index.js.map