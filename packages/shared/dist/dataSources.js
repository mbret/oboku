"use strict";
var _a;
exports.__esModule = true;
exports.dataSourceHelpers = exports.extractIdFromResourceId = exports.generateResourceId = exports.dataSourcePlugins = exports.DataSourceType = void 0;
var DataSourceType;
(function (DataSourceType) {
    DataSourceType["URI"] = "URI";
    DataSourceType["DRIVE"] = "DRIVE";
    DataSourceType["DROPBOX"] = "DROPBOX";
    DataSourceType["FILE"] = "FILE";
    DataSourceType["NHENTAI"] = "NHENTAI";
})(DataSourceType = exports.DataSourceType || (exports.DataSourceType = {}));
exports.dataSourcePlugins = (_a = {},
    _a[DataSourceType.DRIVE] = {
        uniqueResourceIdentifier: 'drive',
        type: DataSourceType.DRIVE
    },
    _a[DataSourceType.DROPBOX] = {
        uniqueResourceIdentifier: 'dropbox',
        type: DataSourceType.DROPBOX
    },
    _a[DataSourceType.FILE] = {
        uniqueResourceIdentifier: 'oboku-file',
        type: DataSourceType.FILE
    },
    _a[DataSourceType.URI] = {
        uniqueResourceIdentifier: 'oboku-link',
        type: DataSourceType.URI
    },
    _a[DataSourceType.NHENTAI] = {
        uniqueResourceIdentifier: 'nhentai',
        name: "nhentai",
        synchronizable: false,
        type: DataSourceType.NHENTAI
    },
    _a);
var generateResourceId = function (uniqueResourceIdentifier, resourceId) { return uniqueResourceIdentifier + "-" + resourceId; };
exports.generateResourceId = generateResourceId;
var extractIdFromResourceId = function (uniqueResourceIdentifier, resourceId) { return resourceId.replace(uniqueResourceIdentifier + "-", ""); };
exports.extractIdFromResourceId = extractIdFromResourceId;
exports.dataSourceHelpers = {
    generateResourceId: exports.generateResourceId,
    extractIdFromResourceId: exports.extractIdFromResourceId
};
