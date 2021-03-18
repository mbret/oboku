"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.READER_SUPPORTED_MIME_TYPES = exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = exports.READER_SUPPORTED_EXTENSIONS = void 0;
var extensions = ['.epub', '.txt', '.cbz', '.cbr'];
exports.READER_SUPPORTED_EXTENSIONS = __spreadArray(__spreadArray([], extensions), extensions.map(function (e) { return e.toUpperCase(); }));
exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = ['application/x-cbz', 'application/epub+zip', 'application/zip'];
exports.READER_SUPPORTED_MIME_TYPES = ['application/x-cbz', 'application/epub+zip', 'text/xml', 'application/x-cbr', 'application/zip'];
