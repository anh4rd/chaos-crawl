export default {
  customSyntax: "postcss-scss",
  plugins: ["stylelint-scss"],
  rules: {
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "max-nesting-depth": 6,
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      { resolveNestedSelectors: true },
    ],
    "selector-max-type": 1,
    "scss/at-rule-no-unknown": true,
    "scss/dollar-variable-pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
  },
};
