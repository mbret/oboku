"use strict";
var _a;
exports.__esModule = true;
exports.dataSourcePlugins = exports.DataSourceType = void 0;
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
        uniqueResourceIdentifier: 'drive'
    },
    _a[DataSourceType.DROPBOX] = {
        uniqueResourceIdentifier: 'dropbox'
    },
    _a[DataSourceType.FILE] = {
        uniqueResourceIdentifier: 'oboku-file'
    },
    _a[DataSourceType.URI] = {
        uniqueResourceIdentifier: 'oboku-link'
    },
    _a[DataSourceType.NHENTAI] = {
        uniqueResourceIdentifier: 'nhentai',
        name: "nhentai",
        synchronizable: false,
        type: DataSourceType.NHENTAI
    },
    _a);
