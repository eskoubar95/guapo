/** Jest config for @guapo/commerce. Use TEST_TYPE=unit | integration:http | integration:modules */
const testType = process.env.TEST_TYPE || "unit";

module.exports = {
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2022",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  testMatch:
    testType === "unit"
      ? ["**/src/**/__tests__/**/*.unit.spec.ts", "**/src/**/__tests__/**/*.test.ts"]
      : [],
  modulePathIgnorePatterns: ["dist/", ".medusa/"],
  collectCoverageFrom: ["src/**/*.ts"].concat(
    testType === "unit" ? ["!src/**/__tests__/**"] : []
  ),
};
