module.exports = {
  root: true,
  env: {
    'jest/globals': true,
  },
  extends: [
    '@react-native',
    'plugin:jest/recommended', 
  ],
  plugins: [
    'jest', 
  ],
};
