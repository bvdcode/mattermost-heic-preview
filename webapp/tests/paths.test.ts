import assert from 'node:assert/strict';
import test from 'node:test';

import {PLUGIN_ID, resourceUrls, siteBasePath} from '../src/paths';

test('resolves Mattermost subpath without treating /static as part of SiteURL', () => {
    assert.equal(siteBasePath(`https://mm.example/chat/static/plugins/${PLUGIN_ID}/bundle.js`), '/chat');
    assert.equal(siteBasePath(`https://mm.example/static/plugins/${PLUGIN_ID}/bundle.js`), '');
});

test('constructs original and public runtime URLs within the same SiteURL', () => {
    assert.deepEqual(resourceUrls('/chat', 'file123'), {
        original: '/chat/api/v4/files/file123',
        runtime: `/chat/plugins/${PLUGIN_ID}/public/heic/`,
    });
});

test('rejects file ID traversal and unexpected script paths', () => {
    assert.throws(() => resourceUrls('', '../other'));
    assert.throws(() => siteBasePath('https://mm.example/other/plugin.js'));
});
