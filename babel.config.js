module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its babel transform into react-native-worklets (verified against
    // the installed package - react-native-reanimated/plugin now just re-exports this).
    // Must be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
