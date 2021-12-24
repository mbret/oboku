"use strict";
exports.__esModule = true;
exports.dataSourceHelpers = exports.extractSyncSourceData = exports.extractIdFromResourceId = exports.generateResourceId = exports.dataSourcePlugins = void 0;
exports.dataSourcePlugins = {
    DRIVE: {
        uniqueResourceIdentifier: 'drive',
        type: "DRIVE"
    },
    DROPBOX: {
        uniqueResourceIdentifier: 'dropbox',
        type: "DROPBOX"
    },
    FILE: {
        uniqueResourceIdentifier: 'oboku-file',
        type: "FILE"
    },
    URI: {
        uniqueResourceIdentifier: 'oboku-link',
        type: "URI"
    },
    NHENTAI: {
        uniqueResourceIdentifier: 'nhentai',
        name: "nhentai",
        synchronizable: false,
        type: "NHENTAI",
        sensitive: true
    }
};
var generateResourceId = function (uniqueResourceIdentifier, resourceId) { return uniqueResourceIdentifier + "-" + resourceId; };
exports.generateResourceId = generateResourceId;
var extractIdFromResourceId = function (uniqueResourceIdentifier, resourceId) { return resourceId.replace(uniqueResourceIdentifier + "-", ""); };
exports.extractIdFromResourceId = extractIdFromResourceId;
var extractSyncSourceData = function (_a) {
    var data = _a.data;
    try {
        return JSON.parse(data);
    }
    catch (e) {
        return undefined;
    }
};
exports.extractSyncSourceData = extractSyncSourceData;
exports.dataSourceHelpers = {
    generateResourceId: exports.generateResourceId,
    extractIdFromResourceId: exports.extractIdFromResourceId,
    extractSyncSourceData: exports.extractSyncSourceData
};
