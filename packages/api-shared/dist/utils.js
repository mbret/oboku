"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForRandomTime = void 0;
const waitForRandomTime = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
exports.waitForRandomTime = waitForRandomTime;
//# sourceMappingURL=utils.js.map