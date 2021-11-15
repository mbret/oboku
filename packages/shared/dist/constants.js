"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.READER_SUPPORTED_MIME_TYPES = exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = exports.READER_SUPPORTED_EXTENSIONS = void 0;
var extensions = ['.epub', '.txt', '.cbz', '.cbr'];
exports.READER_SUPPORTED_EXTENSIONS = __spreadArray(__spreadArray([], extensions, true), extensions.map(function (e) { return e.toUpperCase(); }), true);
exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = ['application/x-cbz', 'application/epub+zip', 'application/zip'];
exports.READER_SUPPORTED_MIME_TYPES = ['application/x-cbz', 'application/epub+zip', 'text/xml', 'application/x-cbr', 'application/zip'];
