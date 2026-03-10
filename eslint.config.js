import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // ── Ignore patterns ──────────────────────────────────────────────────────
  {
    ignores: ["out/**", "node_modules/**", "public/styles/**"],
  },

  // ── TypeScript + TSX source files ────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ── TypeScript ────────────────────────────────────────────────────────
      // Warn on `any` — allowed in Script children (gDom is any) but
      // encourage proper typing everywhere else.
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused variables are errors; prefix with _ to intentionally ignore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Prefer type-only imports where possible.
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],

      // ── General JS quality ────────────────────────────────────────────────
      // Disallow var — always use const/let.
      "no-var": "error",

      // Enforce const when variable is never reassigned.
      "prefer-const": "error",

      // Allow console.info and console.error (used in layouts/handlers),
      // but warn on console.log (debug noise).
      "no-console": ["warn", { allow: ["info", "error", "warn"] }],

      // Catch accidental equality bugs.
      eqeqeq: ["error", "always"],

      // No unused expressions (e.g. `a && b` without storing the result).
      "no-unused-expressions": "error",

      // ── Streak-specific conventions ───────────────────────────────────────
      // Widget default exports must not be anonymous arrow functions —
      // named exports aid debugging in Streak's renderer.
      "func-style": ["warn", "expression", { allowArrowFunctions: true }],
    },
  },

  // ── Test files — relaxed rules ────────────────────────────────────────────
  {
    files: ["src/tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];
