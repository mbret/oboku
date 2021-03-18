"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.removeDirectiveFromString = exports.extractMetadataFromName = void 0;
var BASE_DETECTION_REGEX = "\\[oboku\\~[^\\]]*\\]";
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
            tags = __spreadArray(__spreadArray([], tags), (newTags || []));
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
var removeDirectiveFromString = function (str) { return str
    .replace(new RegExp("( " + BASE_DETECTION_REGEX + ")+", 'ig'), '')
    .replace(new RegExp("(" + BASE_DETECTION_REGEX + " )+", 'ig'), '')
    .replace(new RegExp("(" + BASE_DETECTION_REGEX + ")+", 'ig'), ''); };
exports.removeDirectiveFromString = removeDirectiveFromString;
