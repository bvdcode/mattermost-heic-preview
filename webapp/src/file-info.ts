import type {FileInfo, MattermostState} from './model';

const HEIC_FILENAME = /\.(heic|heif)$/i;
const HEIC_MIME = /^image\/(heic|heif)(-sequence)?$/i;

export function isHeic(file: FileInfo | null | undefined): boolean {
    if (!file) {
        return false;
    }
    const extension = file.extension?.replace(/^\./, '').toLowerCase();
    return extension === 'heic' || extension === 'heif' ||
        HEIC_FILENAME.test(file.name) || HEIC_MIME.test(file.mime_type ?? file.type ?? '');
}

export function getHeicFilesForPost(state: MattermostState, postId: string): FileInfo[] {
    const post = state.entities?.posts?.posts?.[postId];
    if (!post) {
        return [];
    }
    const metadataFiles = post.metadata?.files ?? [];
    const metadataById = new Map(metadataFiles.map((file) => [file.id, file]));
    const storedFileIds = state.entities?.files?.fileIdsByPostId?.[postId];
    let fileIds: string[];
    if (storedFileIds?.length) {
        fileIds = storedFileIds;
    } else if (post.file_ids?.length) {
        fileIds = post.file_ids;
    } else {
        fileIds = metadataFiles.map((file) => file.id);
    }
    const fileMap = state.entities?.files?.files ?? {};
    const seen = new Set<string>();
    const result: FileInfo[] = [];
    for (const id of fileIds) {
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        const file = fileMap[id] ?? metadataById.get(id);
        if (file && isHeic(file) && !file.delete_at) {
            result.push(file);
        }
    }
    return result;
}
