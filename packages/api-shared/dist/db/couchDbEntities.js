"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(_id, email, password, contentPassword) {
        this._id = _id;
        this.email = email;
        this.password = password;
        this.contentPassword = contentPassword;
        this.roles = [];
        this.type = 'user';
        this.name = email;
    }
    processAPIResponse(response) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}
exports.User = User;
//# sourceMappingURL=couchDbEntities.js.map