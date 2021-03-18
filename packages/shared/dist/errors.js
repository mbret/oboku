"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.ObokuSharedError = exports.ERROR_DATASOURCE_NETWORK_UNREACHABLE = exports.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED = exports.ERROR_DATASOURCE_UNAUTHORIZED = exports.ERROR_DATASOURCE_UNKNOWN = exports.ERROR_INVALID_BETA_CODE = exports.BAD_USER_INPUT = exports.ERROR_EMAIL_TAKEN = void 0;
exports.ERROR_EMAIL_TAKEN = '1000';
exports.BAD_USER_INPUT = '2000';
exports.ERROR_INVALID_BETA_CODE = '3000';
exports.ERROR_DATASOURCE_UNKNOWN = '4000';
exports.ERROR_DATASOURCE_UNAUTHORIZED = '4001';
exports.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED = '4002';
exports.ERROR_DATASOURCE_NETWORK_UNREACHABLE = '4003';
var ObokuSharedError = /** @class */ (function (_super) {
    __extends(ObokuSharedError, _super);
    function ObokuSharedError(code, previousError) {
        var _this = _super.call(this, (previousError === null || previousError === void 0 ? void 0 : previousError.message) || '') || this;
        _this.code = code;
        _this.previousError = previousError;
        return _this;
    }
    return ObokuSharedError;
}(Error));
exports.ObokuSharedError = ObokuSharedError;
