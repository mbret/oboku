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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = void 0;
const request_1 = __importDefault(require("request"));
exports.dataSource = {
    download: (link) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const stream = request_1.default({ uri: link.resourceId })
                .on('error', reject)
                .on('response', (response) => {
                resolve({
                    stream,
                    metadata: Object.assign(Object.assign({}, response.headers['content-length'] && {
                        size: response.headers['content-length']
                    }), response.headers['content-type'] && {
                        contentType: response.headers['content-type']
                    }),
                });
            });
        });
    }),
    sync: () => __awaiter(void 0, void 0, void 0, function* () { return ({ items: [], name: '' }); })
};
//# sourceMappingURL=index.js.map