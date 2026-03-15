module.exports = {
  preset: "ts-jest",
  verbose: true,
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/test/__mocks__/styleMock.js",
  },
  testMatch: ["<rootDir>/test/**/*.test.tsx", "<rootDir>/test/**/*.test.ts"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "ts-jest",
      {
        tsconfig: {
          module: "esnext",
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(tweeter-shared)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
