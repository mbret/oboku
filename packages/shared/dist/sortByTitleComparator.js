"use strict";
exports.__esModule = true;
exports.sortByTitleComparator = void 0;
var sortByTitleComparator = function (a, b) {
    var _a;
    var alist = a.split(/(\d+)/);
    var blist = b.split(/(\d+)/);
    alist.slice(-1) === [""] && alist.pop();
    blist.slice(-1) === [""] && blist.pop();
    for (var i = 0, len = alist.length; i < len; i++) {
        if (alist[i] !== blist[i]) {
            if ((_a = alist[i]) === null || _a === void 0 ? void 0 : _a.match(/\d/)) {
                return +(alist[i] || "") - +(blist[i] || "");
            }
            else {
                return (alist[i] || "").localeCompare((blist[i] || ""));
            }
        }
    }
    return 1;
};
exports.sortByTitleComparator = sortByTitleComparator;
