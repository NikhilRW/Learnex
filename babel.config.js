const plugins = [
  'nativewind/babel',
  'react-native-reanimated/plugin',
  [
    'babel-plugin-inline-import',
    {
      extensions: ['.svg'],
    },
  ],
  [
    'module-resolver',
    {
      root: ['./'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': './src',
        'lex-ai': './src/features/LexAI',
        conversations: './src/features/Conversations',
        'create-post': './src/features/CreatePost',
        'events-and-hackathons': './src/features/EventsAndHackathons',
        'generate-qr': './src/features/GenerateQR',
        'search-post': './src/features/SearchPost',
        home: './src/features/Home',
        shared: './src/shared',
        res: './src/shared/res',
        'getting-started': './src/features/GettingStarted',
        auth: './src/features/Auth',
        'qr-code': './src/features/GenerateQR',
        tasks: './src/features/Tasks',
        'saved-post': './src/features/SavedPost',
        hooks: './src/shared/hooks',
        room: './src/features/Room',
      },
    },
  ],
];

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins,
};
