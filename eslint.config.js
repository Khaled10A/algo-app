import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const cypressGlobals = {
  cy: "readonly",
  Cypress: "readonly",
  expect: "readonly",
  assert: "readonly",
  describe: "readonly",
  context: "readonly",
  it: "readonly",
  specify: "readonly",
  before: "readonly",
  after: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
};

export default [
  {
    ignores: ["dist/", "node_modules/", "coverage/", "landing/"],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "unused-imports": unusedImports,
    },
    rules: {
      // --- Core JS: catch real bugs, not style (Prettier owns style) ---
      "no-undef": "error",
      "no-unreachable": "error",
      "no-dupe-keys": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-fallthrough": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-constant-binary-expression": "error",
      "no-loss-of-precision": "error",
      "no-promise-executor-return": "error",
      "no-self-assign": "error",
      "no-template-curly-in-string": "error",
      "no-unused-private-class-members": "error",
      "use-isnan": "error",

      // --- React ---
      // New JSX transform (React 17+): no need to import React in scope.
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react/no-unknown-property": "error",
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
      "react/no-children-prop": "error",
      "react/no-danger": "warn",
      "react/display-name": "warn",

      // --- React Hooks (classic rules only; the compiler-era rules in
      //     react-hooks v7's flat.recommended are too opinionated for a
      //     plain React 18 app without the compiler) ---
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // --- Unused imports/vars: imports are auto-fixable via --fix; locals
      //     and args are reported for manual review. ---
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // --- Accessibility (jsx-a11y recommended set) ---
      ...jsxA11y.flatConfigs.recommended.rules,
      // Interactive controls already handle keyboard events in several
      // components; don't demand the full click/key pattern everywhere.
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/anchor-is-valid": "warn",
    },
  },

  // Cypress E2E specs run in the browser under Mocha-style globals.
  {
    files: ["cypress/**/*.js"],
    languageOptions: {
      globals: cypressGlobals,
    },
  },
];
