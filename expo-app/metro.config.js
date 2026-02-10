const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix for Windows: prevent Expo from creating node:sea externals folders
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
