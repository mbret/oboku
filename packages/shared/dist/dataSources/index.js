"use strict";
exports.__esModule = true;
exports.dataSourceHelpers = exports.extractSyncSourceData = exports.extractIdFromResourceId = exports.generateResourceId = void 0;
var generateResourceId = function (uniqueResourceIdentifier, resourceId) { return "".concat(uniqueResourceIdentifier, "-").concat(resourceId); };
exports.generateResourceId = generateResourceId;
var extractIdFromResourceId = function (uniqueResourceIdentifier, resourceId) { return resourceId.replace("".concat(uniqueResourceIdentifier, "-"), ""); };
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
