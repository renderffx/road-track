const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: path.resolve(__dirname),
});

module.exports = [
  ...compat.extends("next/core-web-vitals"),
];
