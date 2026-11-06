'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const archives = fs.readdirSync(dist).filter((f) => f.endsWith('.tar.gz'));
if (archives.length !== 1) throw new Error(`Expected exactly one plugin archive, got ${archives.length}`);
const name = archives[0];
const members = execFileSync('tar', ['-tzf', path.join(dist, name)], {encoding: 'utf8'}).split('\n').filter(Boolean);
const prefix = 'com.bvdcode.heic-preview/';
for (const required of [
    prefix + 'plugin.json',
    prefix + 'webapp/dist/main.js',
    prefix + 'public/heic/heic.worker.js',
    prefix + 'public/heic/runtime/_framework/dotnet.js',
]) {
    if (!members.includes(required)) throw new Error(`Missing Mattermost bundle member: ${required}`);
}
if (!members.some((member) => member.endsWith('.wasm'))) throw new Error('Missing decoder WASM binaries');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, prefix, 'plugin.json'), 'utf8'));
if (manifest.id !== 'com.bvdcode.heic-preview' || manifest.webapp?.bundle_path !== 'webapp/dist/main.js') throw new Error('Unexpected manifest');
const bundle = fs.statSync(path.join(dist, name));
if (bundle.size < 100_000) throw new Error('Suspiciously small bundle: the decoder is likely missing');
process.stdout.write(`Verified installable Mattermost bundle: ${name} (${Math.round(bundle.size / 1024)} KiB), ${members.length} files\n`);
