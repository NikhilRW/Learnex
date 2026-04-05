const {getDefaultConfig} = require('expo/metro-config');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);
module.exports = config;