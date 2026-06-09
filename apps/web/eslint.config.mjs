import eslint from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

export default [
  eslint.configs.recommended,
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        React: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];
