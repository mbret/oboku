"use strict";
var _a;
exports.__esModule = true;
exports.plugins = void 0;
var docTypes_1 = require("./docTypes");
exports.plugins = (_a = {},
    _a[docTypes_1.DataSourceType.DRIVE] = {
        uniqueResourceIdentifier: 'drive'
    },
    _a[docTypes_1.DataSourceType.DROPBOX] = {
        uniqueResourceIdentifier: 'dropbox'
    },
    _a[docTypes_1.DataSourceType.FILE] = {
        uniqueResourceIdentifier: 'oboku-file'
    },
    _a[docTypes_1.DataSourceType.URI] = {
        uniqueResourceIdentifier: 'oboku-link'
    },
    _a);
