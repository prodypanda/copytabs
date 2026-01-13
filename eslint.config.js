const js = require("@eslint/js");
const globals = require("globals");
const typescript = require("typescript-eslint");

module.exports = [
  {
    ignores: ["node_modules/", "out/", "dist/", ".vscode-test/", "*.min.js"]
  },
  js.configs.recommended,
  ...typescript.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
