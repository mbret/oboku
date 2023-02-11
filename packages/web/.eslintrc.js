module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    `prettier`,
    `plugin:react/recommended`,
    `plugin:react/jsx-runtime`,
    `plugin:react-hooks/recommended`
  ],
  parser: `@typescript-eslint/parser`,
  parserOptions: {
    ecmaVersion: 12,
    sourceType: `module`,
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: [`@typescript-eslint`, `react`],
  rules: {
    "node/no-callback-literal": `off`, // huh, 1990 coding
    "no-unused-vars": `off`, // use ts
    "no-use-before-define": `off`, // use ts
    "no-undef": `off`, // use ts
    "no-redeclare": `off`, // use ts
    "@typescript-eslint/no-explicit-any": ["warn"],
    "react/display-name": ["off"],
    "react/prop-types": ["off"],
    "react/no-unescaped-entities": ["off"],
    "react/no-unknown-property": ["off"] // use ts
  }
}
