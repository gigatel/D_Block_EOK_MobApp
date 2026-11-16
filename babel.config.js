module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
        },
      },
    ],
    // zod 4 uses `export * as ns from` syntax.
    '@babel/plugin-transform-export-namespace-from',
    // Must be listed last (Reanimated 4 / worklets).
    'react-native-worklets/plugin',
  ],
};
