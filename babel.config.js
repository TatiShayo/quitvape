// babel-preset-expo enables expo-router and (with reanimated installed) the
// react-native-worklets/reanimated babel transform automatically. Keep this minimal.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
