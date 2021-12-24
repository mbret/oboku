"use strict";
exports.__esModule = true;
exports.isCollection = exports.isDataSource = exports.isLink = exports.isBook = exports.isTag = exports.ReadingStateState = void 0;
var ReadingStateState;
(function (ReadingStateState) {
    ReadingStateState["Finished"] = "FINISHED";
    ReadingStateState["NotStarted"] = "NOT_STARTED";
    ReadingStateState["Reading"] = "READING";
})(ReadingStateState = exports.ReadingStateState || (exports.ReadingStateState = {}));
function isTag(document) {
    return document.rx_model === 'tag';
}
exports.isTag = isTag;
function isBook(document) {
    return document.rx_model === 'book';
}
exports.isBook = isBook;
function isLink(document) {
    return document.rx_model === 'link';
}
exports.isLink = isLink;
function isDataSource(document) {
    return document.rx_model === 'datasource';
}
exports.isDataSource = isDataSource;
function isCollection(document) {
    return document.rx_model === 'obokucollection';
}
exports.isCollection = isCollection;
