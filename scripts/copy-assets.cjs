'use strict';
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'public', 'heic');
fs.rmSync(dest, {recursive: true, force: true});
fs.mkdirSync(dest, {recursive: true});
const bin = path.join(root, 'webapp', 'node_modules', '.bin',
    process.platform === 'win32' ? 'heic-net-assets.cmd' : 'heic-net-assets');
const result = spawnSync(bin, [dest], {stdio: 'inherit', shell: process.platform === 'win32'});
if (result.error || result.status !== 0) {
    process.stderr.write(String(result.error || 'heic-net asset copy failed') + '\n');
    process.exit(1);
}
process.stdout.write('heic-net WASM assets copied to public/heic\n');
