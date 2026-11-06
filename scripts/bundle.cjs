'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const version = process.env.PLUGIN_VERSION || manifest.version;
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid plugin semver: ' + version);
manifest.version = version;
const dist = path.join(root, 'dist');
const staging = path.join(dist, manifest.id);
const js = path.join(root, 'webapp', 'dist', 'main.js');
const worker = path.join(root, 'public', 'heic', 'heic.worker.js');
const wasmAssets = path.join(root, 'public', 'heic', 'runtime');
for (const required of [js, worker, wasmAssets]) {
    if (!fs.existsSync(required)) throw new Error('Build incomplete, required asset missing: ' + required);
}
fs.rmSync(dist, {recursive: true, force: true});
fs.mkdirSync(staging, {recursive: true});
fs.writeFileSync(path.join(staging, 'plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.cpSync(path.join(root, 'webapp', 'dist'), path.join(staging, 'webapp', 'dist'), {recursive: true});
fs.cpSync(path.join(root, 'public'), path.join(staging, 'public'), {recursive: true});
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(staging, 'LICENSE'));
const output = `mattermost-heic-preview-${version}.tar.gz`;
const result = spawnSync('tar', ['-czf', output, manifest.id], {cwd: dist, stdio: 'inherit'});
if (result.error || result.status !== 0) throw result.error || new Error('tar packaging failed');
process.stdout.write(path.join(dist, output) + '\n');
