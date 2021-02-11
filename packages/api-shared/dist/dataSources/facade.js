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
exports.dataSourceFacade = void 0;
const shared_1 = require("@oboku/shared");
const google_1 = require("@oboku/api-shared/src/dataSources/google");
const dropbox_1 = require("@oboku/api-shared/src/dataSources/dropbox");
const url_1 = require("@oboku/api-shared/src/dataSources/url");
const helpers_1 = require("./helpers");
const sync_1 = require("./sync");
const helpers_2 = require("../db/helpers");
exports.dataSourceFacade = {
    dowload: (link, credentials) => __awaiter(void 0, void 0, void 0, function* () {
        switch (link.type) {
            case shared_1.DataSourceType.DRIVE:
                return google_1.dataSource.download(link, credentials);
            case shared_1.DataSourceType.DROPBOX:
                return dropbox_1.dataSource.download(link, credentials);
            default:
                return url_1.dataSource.download(link);
        }
    }),
    sync: ({ dataSourceId, userEmail, credentials, refreshBookMetadata, db, isBookCoverExist }) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`dataSourceFacade started sync for ${dataSourceId} with user ${userEmail}`);
        const userId = Buffer.from(userEmail).toString('hex');
        const helpers = helpers_1.createHelpers(dataSourceId, refreshBookMetadata, db, isBookCoverExist, userId);
        try {
            const dataSource = yield helpers.findOne('datasource', { selector: { _id: dataSourceId } });
            if (!dataSource)
                throw new Error('Data source not found');
            const { type } = dataSource;
            // we create the date now on purpose so that if something change on the datasource
            // during the process (which can take time), user will not be misled to believe its
            // latest changes have been synced
            const lastSyncedAt = new Date().getTime();
            const ctx = { dataSourceId, userEmail, credentials, dataSourceType: type };
            const runSync = () => {
                switch (type) {
                    case shared_1.DataSourceType.DRIVE:
                        return google_1.dataSource.sync(ctx, helpers);
                    case shared_1.DataSourceType.DROPBOX:
                        return dropbox_1.dataSource.sync(ctx, helpers);
                    default: { }
                }
            };
            const syncable = yield runSync();
            if (syncable) {
                yield sync_1.sync(syncable, ctx, helpers);
            }
            yield helpers_2.atomicUpdate(db, 'datasource', dataSourceId, old => (Object.assign(Object.assign({}, old), { lastSyncedAt, lastSyncErrorCode: null })));
            console.log(`dataSourcesSync for ${dataSourceId} completed successfully`);
        }
        catch (e) {
            let lastSyncErrorCode = shared_1.Errors.ERROR_DATASOURCE_UNKNOWN;
            if (e instanceof shared_1.ObokuSharedError) {
                lastSyncErrorCode = e.code;
            }
            yield helpers_2.atomicUpdate(db, 'datasource', dataSourceId, old => (Object.assign(Object.assign({}, old), { lastSyncErrorCode })));
            throw e;
        }
    })
};
//# sourceMappingURL=facade.js.map