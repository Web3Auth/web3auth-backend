import toruslabsNode from "@toruslabs/eslint-config-node";

export default [
  ...toruslabsNode,
  {
    rules: {
      camelcase: 0,
      "n/no-unpublished-import": "off",
    },
  },
  {
    files: ["**/eslint.config.mjs", "**/test/**"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
