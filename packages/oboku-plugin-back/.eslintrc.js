module.exports = {
  env: {
    browser: false,
    es2021: true,
    "jest/globals": true
  },
  global: {
    NodeJS: true
  },
  extends: [
    `plugin:jest/recommended`,
    `standard`
  ],
  parser: `@typescript-eslint/parser`,
  parserOptions: {
    ecmaVersion: 12,
    sourceType: `module`
  },
  plugins: [
    `jest`,
    `@typescript-eslint`
  ],
  rules: {
    "node/no-callback-literal": `off`, // huh, 1990 coding
    "no-unused-vars": `off`, // use ts
    "no-redeclare": `off`, // use ts
    quotes: [`error`, `backtick`]
  }
}
