"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.READER_SUPPORTED_MIME_TYPES = exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = exports.READER_SUPPORTED_EXTENSIONS = void 0;
var extensions = ['.epub', '.txt', '.cbz', '.cbr'];
exports.READER_SUPPORTED_EXTENSIONS = __spreadArrays(extensions, extensions.map(function (e) { return e.toUpperCase(); }));
exports.METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS = ['application/x-cbz', 'application/epub+zip'];
exports.READER_SUPPORTED_MIME_TYPES = ['application/x-cbz', 'application/epub+zip', 'text/xml', 'application/x-cbr'];
