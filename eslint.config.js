// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // As telas carregam dados do Supabase dentro de useEffect (mesmo padrão do site).
      // Fica como aviso, não erro.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
