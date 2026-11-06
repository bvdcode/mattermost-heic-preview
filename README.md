# Mattermost HEIC Preview

Display `.heic` and `.heif` image attachments **inline in existing and new
Mattermost posts** with [heic-net](https://www.npmjs.com/package/heic-net).
The original image remains in Mattermost without modification or duplicate uploads.

**Status:** preview build, pending installation testing on a real Mattermost
server. CI runs unit tests, TypeScript checks, ESLint, archive validation and a
Chromium test that decodes a real HEIC fixture using the published `heic-net`
WebAssembly runtime.

## Install

1. Open this repository's [Releases](https://github.com/bvdcode/mattermost-heic-preview/releases).
2. Download the attached `mattermost-heic-preview-*.tar.gz`. Do **not** download
   GitHub's "Source code" ZIP or TAR archive.
3. In Mattermost **System Console → Plugins → Plugin Management**, upload the
   `.tar.gz` and enable **HEIC Preview**.
4. Reload Mattermost in a browser or desktop application. Old `.heic`/`.heif`
   attachments will gain inline previews as their posts enter the viewport.

For custom unsigned plugins, the server must allow plugin uploads and must not
require a signature. Consult your organization's security policy before changing
`PluginSettings.EnableUploads` or `PluginSettings.RequirePluginSignature`.

## Behavior

- Existing HEIC/HEIF attachments display directly in their posts as images.
- Click the image to open Mattermost's existing file-preview modal, with a
  HEIC-specific file-preview component registered by the plugin.
- The original download remains available from Mattermost.
- Decoding runs in the browser through `heic-net`'s WebAssembly Web Worker. No
  content is sent to third parties or converted on the server.
- The original file card is hidden only once the inline preview has loaded.
  Mattermost has no public API for replacing the existing file card, so this
  step uses a narrowly scoped DOM adapter. If the card cannot be matched, both
  may be visible instead of hiding an unrelated attachment.
- Bad/unsupported HEIC data leaves the normal file card unchanged.

This version targets Mattermost 11.x browser and desktop clients. Mattermost's
native Android and iOS applications do not load webapp plugins. A Mattermost
upgrade may require updating the card selector.

## Build and test

Requires Node.js 22, npm and Chromium.

```sh
cd webapp
npm install
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
cd ..
node scripts/bundle.cjs
node scripts/verify-bundle.cjs
```

The bundled plugin will be at `dist/mattermost-heic-preview-0.3.0.tar.gz`.
The archive contains `plugin.json`, the webapp JS/CSS, `heic.worker.js`,
`heic-net`'s entire runtime and all of its license notices.

## Continuous integration and releases

On each push and pull request, Actions runs lint, typecheck, unit tests,
Webpack production build, a Chromium image-decoding integration test, and a
Mattermost archive verification step. A successful push to `main` publishes
an installable `.tar.gz` to Actions artifacts and to a GitHub pre-release.

CI verifies the generated artifact against a miniature reproduction of the
Mattermost 11 attachment markup and plugin registry. It is not a test against
an actual Mattermost server. Real deployment compatibility, CSP behavior,
file permissions and installation need to be validated separately.

## Limitations

- Images are decoded on demand, with encoded files limited to 64 MiB and images
  limited to 60 million pixels. Very large images may require substantial RAM.
- HEIF variations not handled by `heic-net` will retain their original cards.
- Browser canvas JPEG rendering does not preserve HDR or apply ICC color
  management, so some images may look different from their originals.
- A browser must be able to load Web Workers and the bundled WebAssembly files
  under `/plugins/com.bvdcode.heic-preview/public/heic/`.
- This does not create Mattermost-native server thumbnails or change the API
  response. It renders previews where the webapp plugin is enabled.

## License

MIT. Bundles the MIT-licensed `heic-net` decoder and the included .NET runtime
licenses and third-party notices.
