import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    {ignores: ['dist/**', 'node_modules/**']},
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['tests/**/*.mjs'],
        languageOptions: {
            globals: {...globals.browser, ...globals.node},
        },
    },
    {
        files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
        languageOptions: {
            globals: {...globals.browser, ...globals.node},
        },
        rules: {
            'no-console': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'no-restricted-syntax': ['error',
                {selector: 'TSAnyKeyword', message: 'Use explicit, safe types.'},
                {selector: 'TSUnknownKeyword', message: 'Use explicit, safe types.'},
                {selector: 'TSAsExpression TSAsExpression', message: 'Nested casts are not allowed.'},
            ],
        },
    },
);
