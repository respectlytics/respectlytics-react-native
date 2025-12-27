/** @type {import('jest').Config} */
module.exports = {
  // Don't use react-native preset - it requires full RN setup
  // We test our SDK logic in isolation with mocked RN dependencies
  modulePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/test/'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  // Ignore react-native internal modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-native-async-storage)/)',
  ],
};
