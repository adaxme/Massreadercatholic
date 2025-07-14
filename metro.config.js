const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      // Exclude web-specific UI components that are incompatible with React Native
      /src\/components\/ui\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);