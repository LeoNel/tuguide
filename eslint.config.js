module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        importScripts: 'readonly',
        globalThis: 'readonly',
        document: 'readonly',
        DOMParser: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        module: 'readonly',
        require: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always']
    }
  }
];
