// Minimal jest config. Previously there was none at all — every existing domain test
// only used relative imports, so the `@/*` -> `src/*` path alias (tsconfig.json) was
// never actually exercised by jest. It broke the first time a test's import chain
// touched a file using the alias (src/providers/backend/mockBackend.ts importing
// `@/content/encouragements` and `@/domain/anonHandle`). Mirrors the tsconfig alias;
// everything else (transform via babel.config.js, default node test environment,
// default __tests__/*.test.ts discovery) is left at Jest's defaults.
module.exports = {
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
