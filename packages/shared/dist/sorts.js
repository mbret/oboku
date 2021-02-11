"use strict";
exports.__esModule = true;
exports.sortByTitleComparator = void 0;
var sortByTitleComparator = function (a, b) {
    var alist = a.split(/(\d+)/), blist = b.split(/(\d+)/);
    // @ts-ignore
    alist.slice(-1) == '' && alist.pop();
    // @ts-ignore
    blist.slice(-1) == '' && blist.pop();
    for (var i = 0, len = alist.length; i < len; i++) {
        if (alist[i] !== blist[i]) {
            if (alist[i].match(/\d/)) {
                return +alist[i] - +blist[i];
            }
            else {
                return alist[i].localeCompare(blist[i]);
            }
        }
    }
    return 1;
};
exports.sortByTitleComparator = sortByTitleComparator;
