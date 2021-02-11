"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.createAuthenticator = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const errors_1 = require("../errors");
// const createRefreshToken = (name: string, authSession: string) => {
//   return generateToken(name, '1d')
// }
// const generateToken = async (email: string, userId: string, expiresIn: string = '1d') => {
//   const tokenData: Token = { email, userId }
//   return jwt.sign(tokenData, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
// }
const withToken = (privateKey) => (authorization) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!authorization)
            throw new Error('Looks like authorization is empty');
        const token = authorization.replace('Bearer ', '');
        return jwt.verify(token, privateKey, { algorithms: ['RS256'] });
    }
    catch (e) {
        throw new errors_1.UnauthorizedError();
    }
});
const createAuthenticator = ({ privateKey }) => ({
    withToken: withToken(privateKey)
});
exports.createAuthenticator = createAuthenticator;
//# sourceMappingURL=index.js.map