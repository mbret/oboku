"use strict";
exports.__esModule = true;
exports.signupSchema = exports.signinSchema = void 0;
var yup = require("yup");
exports.signinSchema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required()
});
exports.signupSchema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required()
});
