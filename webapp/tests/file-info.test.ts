import assert from 'node:assert/strict';
import test from 'node:test';

import {getHeicFilesForPost, isHeic} from '../src/file-info';
import type {FileInfo, MattermostState, PostInfo} from '../src/model';

function state(post: PostInfo, files: Record<string, FileInfo> = {}, fileIdsByPostId: Record<string, string[]> = {}): MattermostState {
    return {
        entities: {
            posts: {posts: {p1: post}},
            files: {files, fileIdsByPostId},
        },
    };
}

test('detects case-insensitive HEIC and HEIF names, extensions and MIME types', () => {
    assert.equal(isHeic({id: 'a', name: 'IMG_001.HEIC'}), true);
    assert.equal(isHeic({id: 'a', name: 'image', extension: '.heif'}), true);
    assert.equal(isHeic({id: 'a', name: 'image', type: 'image/heic-sequence'}), true);
    assert.equal(isHeic({id: 'a', name: 'image.jpg', type: 'image/jpeg'}), false);
    assert.equal(isHeic(null), false);
});

test('uses metadata of existing posts with files not yet loaded into Redux', () => {
    const post: PostInfo = {file_ids: ['a'], metadata: {files: [{id: 'a', name: 'old.HEIC', extension: 'heic'}]}};
    assert.deepEqual(getHeicFilesForPost(state(post), 'p1').map((f) => f.id), ['a']);
});

test('handles duplicate file IDs, deletion and mixed attachment formats', () => {
    const post: PostInfo = {file_ids: ['a', 'b', 'c', 'a']};
    const files = {
        a: {id: 'a', name: 'photo.HEIF', delete_at: 0},
        b: {id: 'b', name: 'report.pdf'},
        c: {id: 'c', name: 'old.heic', delete_at: 123},
    };
    assert.deepEqual(getHeicFilesForPost(state(post, files), 'p1').map((f) => f.id), ['a']);
});

test('handles empty posts and post/file maps', () => {
    assert.deepEqual(getHeicFilesForPost({}, 'p1'), []);
    assert.deepEqual(getHeicFilesForPost({entities: {}}, 'p1'), []);
    assert.deepEqual(getHeicFilesForPost(state({file_ids: []}), 'p1'), []);
});

test('supports post links stored in fileIdsByPostId', () => {
    const files = {a: {id: 'a', name: 'photo.heic'}};
    assert.deepEqual(getHeicFilesForPost(state({}, files, {p1: ['a']}), 'p1').map((f) => f.id), ['a']);
});
