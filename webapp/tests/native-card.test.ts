import assert from 'node:assert/strict';
import test from 'node:test';

import {parseDownloadFileId} from '../src/native-card';

test('parses Mattermost original and download endpoints', () => {
    assert.equal(parseDownloadFileId('/api/v4/files/abc123'), 'abc123');
    assert.equal(parseDownloadFileId('/chat/api/v4/files/abc123/download'), 'abc123');
    assert.equal(parseDownloadFileId('https://example.com/api/v4/files/abc123/download'), 'abc123');
});

test('rejects unrelated endpoints and invalid file paths', () => {
    assert.equal(parseDownloadFileId('/api/v4/files/abc123/preview'), null);
    assert.equal(parseDownloadFileId('/api/v4/files/../../x'), null);
});
