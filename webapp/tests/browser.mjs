// Real Chromium integration test using the published `heic-net` decoder and
// an HTML reproduction of Mattermost's v11 FileAttachment DOM/Redux state.
// This is NOT a substitute for testing against a running Mattermost instance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '..');
const repoRoot = resolve(root, '..');
const builtBundle = resolve(root, 'dist/main.js');
const runtimeRoot = resolve(repoRoot, 'public/heic');
const reactRoot = resolve(root, 'node_modules');
const fixture = await readFile(resolve(here, 'fixtures/basic-8bit.heic'));
const badFixture = Buffer.from([1, 2, 3, 4, 5]);
let uploads = 0;
let downloads = 0;

async function respondFile(res, path, contentType) {
    try {
        const data = await readFile(path);
        res.writeHead(200, {'Content-Type': contentType, 'Content-Length': data.length});
        res.end(data);
    } catch {
        res.writeHead(404).end('Not Found');
    }
}

const pageHtml = `<!doctype html>
<meta charset="utf-8"><title>Mattermost HEIC plugin browser integration</title>
<div class="post" id="test-post">
  <div id="plugin-slot"></div>
  <div id="modal-slot"></div>
  <div id="attachments">
    <div class="post-image__column" id="original-good"><a class="post-image__thumbnail" href="#">Open</a><div class="post-image__details"><div class="post-image__detail"><span class="post-image__name">old.heic</span></div><div class="post-image__download"><a download="old.heic" href="/api/v4/files/file123">Download</a></div></div></div>
    <div class="post-image__column" id="original-bad"><a class="post-image__thumbnail" href="#">Open</a><div class="post-image__details"><div class="post-image__detail"><span class="post-image__name">broken.heic</span></div><div class="post-image__download"><a download="broken.heic" href="/api/v4/files/file124">Download</a></div></div></div>
  </div>
</div>
<script src="/react.js"></script><script src="/react-dom.js"></script>
<script>
window.registerPlugin = (id, plugin) => { window.registered = {id, plugin}; };
window.nativePreviewClicks = 0;
document.querySelector('#original-good .post-image__thumbnail').addEventListener('click', (event) => {event.preventDefault(); window.nativePreviewClicks += 1;});
const mockState = {entities: {posts:{posts:{post123:{file_ids:['file123','file124'],metadata:{files:[
     {id:'file123',name:'old.heic',extension:'heic'},
     {id:'file124',name:'broken.heic',extension:'heic'},
  ]}}}}, files:{files:{},fileIdsByPostId:{}}}};
window.store = {
  getState: () => mockState,
  subscribe: () => () => {},
};
</script>
<script id="plugin_com.bvdcode.heic-preview" src="/static/plugins/com.bvdcode.heic-preview/main.js"></script>
<script>
try {
  const registered = {};
  const registry = {
    registerPostMessageAttachmentComponent: (component) => { registered.post = component; },
    registerFilePreviewComponent: (match, component) => { registered.match = match; registered.preview = component; },
  };
  window.registered.plugin.initialize(registry, window.store);
  window.registeredHooks = registered;
  window.ReactDOM.createRoot(document.getElementById('plugin-slot')).render(window.React.createElement(registered.post,{postId:'post123',onHeightChange:(height)=>{window.notifiedHeight=height;}}));
  document.documentElement.dataset.ready = 'yes';
} catch (e) {
  document.documentElement.dataset.error = String(e.stack || e);
}
</script>`;
const server = createServer(async (req, res) => {
    if (req.method !== 'GET') {uploads++; res.writeHead(405).end('Not allowed'); return;}
    const requested = new URL(req.url, 'http://localhost').pathname;
    if (requested === '/') {res.writeHead(200, {'Content-Type': 'text/html'}).end(pageHtml);return;}
    if (requested === '/react.js') return respondFile(res, resolve(reactRoot, 'react/umd/react.production.min.js'),'text/javascript');
    if (requested === '/react-dom.js') return respondFile(res, resolve(reactRoot, 'react-dom/umd/react-dom.production.min.js'),'text/javascript');
    if (requested === '/static/plugins/com.bvdcode.heic-preview/main.js') return respondFile(res, builtBundle, 'text/javascript');
    if (['/api/v4/files/file123', '/api/v4/files/file124', '/api/v4/files/file125'].includes(requested)) {
        downloads++;
        const buffer = requested.endsWith('file124')? badFixture : fixture;
        res.writeHead(200, {'Content-Type':'application/octet-stream','Content-Length':buffer.length}).end(buffer);return;
    }
    const prefix='/plugins/com.bvdcode.heic-preview/public/heic/';
    if (requested.startsWith(prefix)) {
        const dest = resolve(runtimeRoot, decodeURIComponent(requested.slice(prefix.length)));
        if (!dest.startsWith(runtimeRoot+sep)) {res.writeHead(403).end();return;}
        const mime = {'.js':'text/javascript','.wasm':'application/wasm','.json':'application/json','.dat':'application/octet-stream'}[extname(dest)] || 'application/octet-stream';
        return respondFile(res,dest,mime);
    }
    res.writeHead(404).end('Not found');
});

await new Promise((resolveListen)=>server.listen(0,'127.0.0.1',resolveListen));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
try {
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForFunction(() => document.documentElement.dataset.ready==='yes' || !!document.documentElement.dataset.error, {timeout:30000});
    assert.equal(await page.locator('html').getAttribute('data-error'),null, 'the webpack plugin should initialize without crashing');
    const registered = await page.evaluate(()=>({id:window.registered.id,postHook:!!window.registeredHooks.post,modalHook:!!window.registeredHooks.preview,override:window.registeredHooks.match({id:'x',name:'photo.heic',extension:'heic'})}));
    assert.deepEqual(registered,{id:'com.bvdcode.heic-preview',postHook:true,modalHook:true,override:true});
    await page.locator('img[alt="old.heic"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#original-good').evaluate(e=>e.classList.contains('bvd-heic-native-hidden')),true);
    assert.equal(await page.locator('#original-bad').evaluate(e=>e.classList.contains('bvd-heic-native-hidden')),false);
    assert.equal(await page.evaluate(()=>window.notifiedHeight),1,'the host needs a positive height to recalculate the post layout');
    await page.locator('.bvd-heic-inline__link').first().click();
    assert.equal(await page.evaluate(() => window.nativePreviewClicks), 1, 'the inline preview should use Mattermost native modal');
    await page.evaluate(() => {
        window.modalRoot = window.ReactDOM.createRoot(document.getElementById('modal-slot'));
        window.modalRoot.render(window.React.createElement(window.registeredHooks.preview, {fileInfo: {id:'file123',name:'old.heic',extension:'heic'}}));
    });
    await page.locator('#modal-slot img[alt="old.heic"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#modal-slot a').count(), 0, 'the preview must not duplicate the native download control');
    let releaseDownload;
    const pendingDownload = new Promise((resolveDownload) => {releaseDownload = resolveDownload;});
    await page.route('**/api/v4/files/file125', async (route) => {
        await pendingDownload;
        await route.continue();
    });
    const renderPreview = async (id, name) => {
        await page.evaluate(({id, name}) => {
            window.modalRoot.render(window.React.createElement(window.registeredHooks.preview, {fileInfo: {id, name, extension:'heic'}}));
        }, {id, name});
    };
    await renderPreview('file125', 'pending.heic');
    await page.locator('#modal-slot [role="status"]').waitFor({state:'visible'});
    assert.equal(await page.locator('#modal-slot a').count(), 0, 'loading must not show a download control');
    releaseDownload();
    await page.locator('#modal-slot img[alt="pending.heic"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#modal-slot a').count(), 0);
    await renderPreview('file124', 'broken.heic');
    await page.locator('#modal-slot [role="alert"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#modal-slot a').count(), 0, 'failed previews must not show a download control');
    assert.equal(await page.locator('#original-bad a[download="broken.heic"]').isVisible(), true, 'the native download must remain available');
    await page.evaluate(() => window.modalRoot.render(null));
    await page.locator('#modal-slot .bvd-heic-modal').waitFor({state:'detached'});
    await renderPreview('file123', 'old.heic');
    await page.locator('#modal-slot img[alt="old.heic"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#modal-slot a').count(), 0, 'reopening must not restore a download control');
    assert.equal(await page.locator('#original-good a[download="old.heic"]').getAttribute('href'), '/api/v4/files/file123');
    assert.equal(uploads,0,'the plugin must never create a new JPEG attachment');
    assert(downloads>0,'decoder must download original protected file bytes');
    assert.deepEqual(errors,[]);
    process.stdout.write('Verified HEIC decode, inline preview, native click and downloads, and no duplicate download control in loading, ready, failed or reopened previews.\n');
} finally {
    await page.close();
    await browser.close();
    await new Promise((resolveClose)=>server.close(resolveClose));
}
