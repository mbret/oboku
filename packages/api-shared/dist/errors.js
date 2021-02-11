"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.BadRequestError = exports.ServerError = void 0;
class ServerError extends Error {
    constructor(previousError) {
        super(previousError === null || previousError === void 0 ? void 0 : previousError.message);
        this.previousError = previousError;
        this.stack = previousError === null || previousError === void 0 ? void 0 : previousError.stack;
    }
}
exports.ServerError = ServerError;
class BadRequestError extends Error {
    constructor(errors = []) {
        super('BadRequestError');
        this.errors = errors;
    }
}
exports.BadRequestError = BadRequestError;
class NotFoundError extends Error {
    constructor(errors = []) {
        super('NotFoundError');
        this.errors = errors;
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(errors = []) {
        super('UnauthorizedError');
        this.errors = errors;
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=errors.js.map