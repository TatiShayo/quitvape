module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^expo/virtual/env$': '<rootDir>/src/config/__mocks__/expoVirtualEnv.js',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/node_modules/react-native-web',
  },
};
