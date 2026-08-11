import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["apps/server/**/*.ts", "packages/**/*.ts", "*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
