import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    files: ["src/**/*.{js,jsx}"],

    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Fix React 17+ JSX runtime errors
      "react/react-in-jsx-scope": "off",

      // Optional
      "react/prop-types": "off",
      "no-unused-vars": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Ignore build files
  {
    ignores: [
      "dist/",
      "build/",
      "public/firebase-messaging-sw.js",
      "public/sw.js",
      "public/workbox-*.js",
    ],
  },
];
