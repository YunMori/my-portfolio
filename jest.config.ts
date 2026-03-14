import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
    testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
    transformIgnorePatterns: [
        '/node_modules/(?!(react-markdown|rehype-sanitize|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-util-stringify-position|unist-util-visit|unist-util-visit-parents|unist-util-is|unist-util-position|unist-util-remove-position|unist-util-generated|mdast-util-from-markdown|mdast-util-to-string|mdast-util-to-markdown|mdast-util-phrasing-content|micromark|micromark-core-commonmark|micromark-extension-gfm|micromark-factory-destination|micromark-factory-label|micromark-factory-space|micromark-factory-title|micromark-factory-whitespace|micromark-util-character|micromark-util-chunked|micromark-util-classify-character|micromark-util-combine-extensions|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-encode|micromark-util-html-tag-name|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|decode-named-character-reference|character-entities|remark-parse|remark-rehype|rehype-raw|hast-util-to-jsx-runtime|hast-util-whitespace|hast-util-from-parse5|hast-util-to-parse5|hast-util-raw|hast-util-is-element|hast-util-has-property|hast-util-to-html|html-void-elements|zwitch|stringify-entities|ccount|comma-separated-tokens|property-information|space-separated-tokens|trim-lines|estree-util-attach-comments|estree-util-build-jsx|estree-util-is-identifier-name|estree-util-to-js|periscopic|astring)/)',
    ],
};

export default createJestConfig(config);
