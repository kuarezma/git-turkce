const eslint = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['node_modules/**', 'coverage/**']
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
                CURATED_REPOSITORIES: 'readonly'
            }
        }
    },
    {
        files: ['data.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: globals.browser
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
            globals: globals.jest
        }
    }
];
