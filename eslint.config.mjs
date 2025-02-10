import config from "eslint-config-standard";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...[].concat(config),
  eslintConfigPrettier,
];