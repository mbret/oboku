import * as yup from 'yup';
export declare const signinSchema: yup.ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>>>;
export declare const signupSchema: yup.ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    code: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    code: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    password: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
    code: import("yup/lib/string").RequiredStringSchema<string, Record<string, any>>;
}>>>;
