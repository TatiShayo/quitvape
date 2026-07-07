// ESLint flat config (ESLint 9). eslint-config-expo ships a flat-config entry point.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    // react-hooks/immutability (React Compiler rule) flags `sharedValue.value = ...`
    // as mutating an "immutable" value. Reanimated's shared values are intentionally
    // mutable refs read on the UI thread — this is the standard, endorsed animation
    // idiom (PLAYBOOK 1.4 motion requirements) and not a React state bug. Disabled
    // project-wide rather than per-line, since every animated screen uses it.
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
];
