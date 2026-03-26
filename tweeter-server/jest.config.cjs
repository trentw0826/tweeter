module.exports = {
  verbose: true,
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/test/unit/**/*.test.js",
    "<rootDir>/test/integration/**/*.test.js",
  ],
  roots: ["<rootDir>/test"],
  transform: {},
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
