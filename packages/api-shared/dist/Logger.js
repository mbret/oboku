"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.configure = void 0;
let _logger = console;
const configure = (logger) => {
    _logger = logger;
};
exports.configure = configure;
exports.Logger = {
    namespace: (name) => ({
        log: (message, ...optionalParams) => _logger.log(name, message, ...optionalParams),
        error: (...optionalParams) => _logger.error(...optionalParams),
    }),
    log: (message, ...optionalParams) => _logger.log(message, ...optionalParams),
    error: (e) => _logger.error(e),
};
//# sourceMappingURL=Logger.js.map