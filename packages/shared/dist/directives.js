"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.extractMetadataFromName = void 0;
/**
* Will extract any oboku normalized metadata that exist in the resource id string.
* Use this method to enrich the content that is being synchronized
* @example
* "foo [oboku~no_collection]" -> { isCollection: false }
* "foo [oboku~tags~bar]" -> { tags: ['bar'] }
* "foo [oboku~tags~bar,bar2]" -> { tags: ['bar', 'bar2'] }
*/
var extractMetadataFromName = function (resourceId) {
    var _a;
    var isNotACollection = false;
    var tags = [];
    var isIgnored = false;
    var direction = undefined;
    var isbn = undefined;
    var directives = (_a = resourceId.match(/(\[oboku\~[^\]]*\])+/ig)) === null || _a === void 0 ? void 0 : _a.map(function (str) {
        return str.replace(/\[oboku~/, '')
            .replace(/\]/, '');
    });
    directives === null || directives === void 0 ? void 0 : directives.forEach(function (directive) {
        if (directive === 'no_collection') {
            isNotACollection = true;
        }
        if (directive === 'ignore') {
            isIgnored = true;
        }
        if (directive.startsWith('direction~')) {
            var value = directive.replace(/direction\~/, '');
            if (value === 'ltr' || value === 'rtl') {
                direction = value;
            }
        }
        if (directive.startsWith('isbn~')) {
            var value = directive.replace(/isbn\~/, '');
            isbn = value;
        }
        if (directive.startsWith('tags~')) {
            var newTags = directive.replace(/tags\~/, '').split(',');
            tags = __spreadArrays(tags, (newTags || []));
        }
    });
    return {
        isNotACollection: isNotACollection,
        tags: tags,
        isIgnored: isIgnored,
        direction: direction,
        isbn: isbn
    };
};
exports.extractMetadataFromName = extractMetadataFromName;
