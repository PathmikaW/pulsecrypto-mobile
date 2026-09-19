// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

const axiosOnlyInApiLayer = {
  name: 'axios',
  message:
    'Import axios only inside src/core/api/. Everything else uses the apiClient through a data source.',
};

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*'],
  },
  // HTTP stays behind the data layer: axios lives in core/api, the apiClient is used by core/data only (ADR-M12).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/core/api/**', 'src/core/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [axiosOnlyInApiLayer],
          patterns: [
            {
              group: ['**/api/apiClient'],
              message: 'Reach REST through a data source (core/data/sources), not the apiClient directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/data/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: [axiosOnlyInApiLayer] }] },
  },
]);
