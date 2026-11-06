export const PLUGIN_ID = 'com.bvdcode.heic-preview';

export function siteBasePath(scriptUrl: string): string {
    const marker = `/static/plugins/${PLUGIN_ID}/`;
    const path = new URL(scriptUrl, 'http://localhost').pathname;
    const position = path.indexOf(marker);
    if (position === -1) {
        throw new Error('Mattermost plugin bundle URL was not found');
    }
    return path.substring(0, position);
}

export function getSiteBasePath(): string {
    const script = document.getElementById(`plugin_${PLUGIN_ID}`);
    if (!(script instanceof HTMLScriptElement)) {
        throw new Error('Mattermost plugin script is unavailable');
    }
    return siteBasePath(script.src);
}

export function resourceUrls(basePath: string, fileId: string): {original: string; runtime: string} {
    if (!/^[a-zA-Z0-9]+$/.test(fileId)) {
        throw new Error('Invalid Mattermost file ID');
    }
    return {
        original: `${basePath}/api/v4/files/${fileId}`,
        runtime: `${basePath}/plugins/${PLUGIN_ID}/public/heic/`,
    };
}
