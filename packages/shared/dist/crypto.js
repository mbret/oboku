"use strict";
exports.__esModule = true;
exports.hashContentPassword = void 0;
var sha256 = require("crypto-js/sha256");
/**
 * The contentPassword is for user content protection. It is made to work
 * offline and therefore is not secured yet. This is not intended for
 * fully secured solution
 */
var hashContentPassword = function (password) {
    return sha256(password).toString();
};
exports.hashContentPassword = hashContentPassword;
