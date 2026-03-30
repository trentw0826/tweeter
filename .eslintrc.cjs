module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    "**/dist/**",
    "**/coverage/**",
    "**/.aws-sam/**",
    "**/node_modules/**",
    "**/*.svg",
    "**/scripts/**",
  ],
  overrides: [
    {
      files: ["**/*.d.ts"],
      rules: {
        "no-var": "off",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/setupTests.ts"],
      env: {
        jest: true,
      },
    },
    {
      files: ["**/*.js", "**/*.cjs"],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "no-extra-boolean-cast": "off",
    "prefer-const": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
  },
};
