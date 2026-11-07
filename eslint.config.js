// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", "node_modules/*"] },
  // apostrophes in <Text> are fine in React Native (the rule is for HTML)
  { rules: { "react/no-unescaped-entities": "off" } },
]);
