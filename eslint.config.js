const eslint = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'graphify-out/**']
    },
    eslint.configs.recommended,
    {
        files: ['eslint.config.js', 'main.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: globals.node
        }
    },
    {
        files: ['app.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...globals.browser,
                module: 'readonly',
                CURATED_REPOSITORIES: 'readonly',
                REPO_KNOWLEDGE: 'readonly'
            }
        }
    },
    {
        files: ['data.js', 'knowledge.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: { ...globals.browser, module: 'readonly' }
        },
        rules: {
            'no-unused-vars': 'off'
        }
    },
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: { ...globals.jest, ...globals.node }
        }
    }
];
