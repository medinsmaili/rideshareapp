const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// This tells Expo to route your Tailwind classes through global.css
module.exports = withNativeWind(config, { input: "./global.css" });