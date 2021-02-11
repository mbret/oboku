"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.getSecrets = void 0;
let secrets = {
    client_id: '',
    client_secret: ''
};
const getSecrets = () => secrets;
exports.getSecrets = getSecrets;
const configure = (options) => {
    secrets = options;
};
exports.configure = configure;
//# sourceMappingURL=configure.js.map