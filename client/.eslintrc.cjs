module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn", // Incremental rollout: warn first
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
  },
  overrides: [
    {
      // Strict modules - escalate to error after cleanup
      files: ["lib/**/*.ts", "components/ui/**/*.tsx"],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ],
};
