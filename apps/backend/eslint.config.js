import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // This codebase's existing convention for an intentionally-unused
      // parameter or destructured binding (e.g. Express's 4-arg error
      // handler, or `const { x: _x, ...rest } = obj` to omit a field) is a
      // leading underscore. Recognize it instead of flagging it.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Turns off ESLint stylistic rules that would otherwise conflict with
  // Prettier, which owns formatting. Keep this last so it can override.
  eslintConfigPrettier,
  {
    ignores: ["dist/**"],
  },
);
