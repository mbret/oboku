"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
/**
 * @see https://github.com/googleapis/google-auth-library-nodejs
 * @see https://github.com/googleapis/google-api-nodejs-client#authentication-and-authorization
 */
const googleapis_1 = require("googleapis");
const configure_1 = require("./configure");
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { client_id, client_secret } = configure_1.getSecrets();
    const oauth2Client = new googleapis_1.google.auth.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
    });
    oauth2Client.setCredentials(ctx.credentials || {});
    return oauth2Client;
});
exports.authorize = authorize;
//# sourceMappingURL=helpers.js.map