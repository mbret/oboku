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
exports.dataSource = exports.extractIdFromResourceId = exports.generateResourceId = exports.configure = void 0;
const helpers_1 = require("./helpers");
const googleapis_1 = require("googleapis");
const shared_1 = require("@oboku/shared");
const configure_1 = require("./configure");
Object.defineProperty(exports, "configure", { enumerable: true, get: function () { return configure_1.configure; } });
const generateResourceId = (driveId) => `drive-${driveId}`;
exports.generateResourceId = generateResourceId;
const extractIdFromResourceId = (resourceId) => resourceId.replace(`drive-`, ``);
exports.extractIdFromResourceId = extractIdFromResourceId;
exports.dataSource = {
    download: (link, credentials) => __awaiter(void 0, void 0, void 0, function* () {
        if (!link.resourceId) {
            throw new Error('Invalid google drive file uri');
        }
        const auth = yield helpers_1.authorize({ credentials });
        const drive = googleapis_1.google.drive({
            version: 'v3',
            auth
        });
        const metadata = (yield drive.files.get({
            fileId: exports.extractIdFromResourceId(link.resourceId),
            fields: 'size, name'
        }, { responseType: 'json' })).data;
        const response = yield drive.files.get({
            fileId: exports.extractIdFromResourceId(link.resourceId),
            alt: 'media',
        }, { responseType: 'stream' });
        return {
            stream: response.data,
            metadata: Object.assign(Object.assign(Object.assign(Object.assign({}, metadata.size && {
                size: metadata.size
            }), { name: '' }), metadata.name && {
                name: metadata.name
            }), { contentType: response.headers['content-type'] }),
        };
    }),
    sync: (ctx, helpers) => __awaiter(void 0, void 0, void 0, function* () {
        const auth = yield helpers_1.authorize(ctx);
        const drive = googleapis_1.google.drive({
            version: 'v3',
            auth
        });
        const { folderId } = yield helpers.getDataSourceData();
        if (!folderId) {
            throw helpers.createError('unknown');
        }
        const getContentsFromFolder = (id) => __awaiter(void 0, void 0, void 0, function* () {
            let pageToken;
            let isDone = false;
            let files = [];
            while (!isDone) {
                const response = yield drive.files.list({
                    spaces: 'drive',
                    q: `
            '${id}' in parents and (
              mimeType='application/vnd.google-apps.folder' 
              ${shared_1.READER_SUPPORTED_MIME_TYPES.map(mimeType => ` or mimeType='${mimeType}'`).join('')}
            )
          `,
                    includeItemsFromAllDrives: true,
                    fields: 'nextPageToken, files(id, kind, name, mimeType, modifiedTime, parents, modifiedTime, trashed)',
                    pageToken: pageToken,
                    supportsAllDrives: true,
                    pageSize: 10,
                });
                pageToken = response.data.nextPageToken || undefined;
                files = [...files, ...response.data.files || []];
                if (!pageToken) {
                    isDone = true;
                }
            }
            return Promise.all(files
                .filter(file => file.trashed !== true)
                .map((file) => __awaiter(void 0, void 0, void 0, function* () {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    return {
                        type: 'folder',
                        resourceId: exports.generateResourceId(file.id || ''),
                        items: yield getContentsFromFolder(file.id || ''),
                        name: file.name || '',
                        modifiedAt: file.modifiedTime || new Date().toISOString()
                    };
                }
                return {
                    type: 'file',
                    resourceId: exports.generateResourceId(file.id || ''),
                    name: file.name || '',
                    modifiedAt: file.modifiedTime || new Date().toISOString()
                };
            })));
        });
        const [items, rootFolderResponse] = yield Promise.all([
            yield getContentsFromFolder(folderId),
            yield drive.files.get({
                fileId: folderId
            })
        ]);
        return {
            items,
            name: rootFolderResponse.data.name || '',
        };
    })
};
//# sourceMappingURL=index.js.map