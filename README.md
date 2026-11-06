# Mattermost HEIC Preview

Inline `.heic` and `.heif` image previews for existing and new Mattermost posts.
Images are decoded in the browser with
[heic-net](https://www.npmjs.com/package/heic-net). Original attachments stay
unchanged, with no duplicate uploads or third-party conversion service.

Targets Mattermost 11.x browser and desktop clients. Native Android and iOS
apps do not load webapp plugins. This is a pre-release; installation on a
running Mattermost server has not been verified.

## Install

1. Download `mattermost-heic-preview-*.tar.gz` from
   [Releases](https://github.com/bvdcode/mattermost-heic-preview/releases).
   Use the plugin archive, not GitHub's "Source code" archive.
2. In Mattermost **System Console → Plugins → Plugin Management**, upload the
   `.tar.gz` and enable **HEIC Preview**.
3. Reload the browser or desktop client.

For custom unsigned plugins, the server must allow plugin uploads and must not
require a signature. Consult your organization's security policy before changing
`PluginSettings.EnableUploads` or `PluginSettings.RequirePluginSignature`.

## Usage and limitations

- Previews load as posts approach the viewport. Click a preview to open
  Mattermost's file viewer; the original file remains available to download.
- A matching file card is hidden after decoding succeeds. Corrupt or unsupported
  files keep their original cards.
- File-card matching depends on Mattermost's attachment markup and may need
  changes after an upgrade. If no card matches, it remains visible and clicking
  the preview opens the original file instead of the viewer.
- Files are limited to 64 MiB and images to 60 million pixels. Large images may
  still use substantial memory. JPEG previews are scaled to at most 1920 pixels
  on the longest side; HDR and ICC color profiles are not preserved.
- The browser must allow Web Workers and WebAssembly from
  `/plugins/com.bvdcode.heic-preview/public/heic/` under the Mattermost site URL.
- The plugin does not generate server-side thumbnails or change API responses.

## Build and test

Requires Node.js 22 and npm. Install Chromium for the browser test:

```sh
cd webapp
npm install
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:browser
cd ..
node scripts/bundle.cjs
node scripts/verify-bundle.cjs
```

The archive is written to `dist/mattermost-heic-preview-0.3.0.tar.gz`, including
the plugin manifest, webapp, decoder runtime and license notices.

The Chromium test decodes a HEIC fixture and checks inline previews, file-viewer
integration, original downloads and corrupt-file handling using simulated
Mattermost markup. Server installation, CSP and file permissions still need
testing on a running Mattermost instance.

## License

MIT. Bundles the MIT-licensed `heic-net` decoder and the included .NET runtime
licenses and third-party notices.
