"use strict";
exports.__esModule = true;
var sortByTitleComparator_1 = require("./sortByTitleComparator");
it("should sort correctly", function () {
    expect(["a", "b"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["a", "b"]);
    expect(["b", "a"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["a", "b"]);
    expect(["1", "2"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["1", "2"]);
    expect(["2", "1"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["1", "2"]);
    expect(["10", "2"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["2", "10"]);
    expect(["foo 10", "foo 11"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["foo 10", "foo 11"]);
    expect(["foo 10", "foo 2"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["foo 2", "foo 10"]);
    expect(["foo 10", "fpo 2"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["foo 10", "fpo 2"]);
    expect(["a 10", "b 2"].sort(sortByTitleComparator_1.sortByTitleComparator)).toEqual(["a 10", "b 2"]);
});
