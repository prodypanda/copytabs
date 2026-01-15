module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    es2020: true,
    node: true,
  },
  rules: {
    "no-console": ["warn", { allow: [] }],
    "prefer-const": "warn",
    "@typescript-eslint/explicit-function-return-types": [
      "warn",
      { allowExpressions: true },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "warn",
    eqeqeq: ["error", "always"],
    "no-var": "error",
  },
  ignorePatterns: [
    "out/",
    "node_modules/",
    "*.min.js",
    "dist/",
    ".vscode-test/",
  ],
};
