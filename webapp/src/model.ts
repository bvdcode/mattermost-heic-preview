import type {ComponentType} from 'react';

export interface FileInfo {
    id: string;
    name: string;
    extension?: string;
    mime_type?: string;
    type?: string;
    delete_at?: number;
}

export interface PostInfo {
    file_ids?: string[];
    metadata?: {files?: FileInfo[]};
}

export interface MattermostState {
    entities?: {
        posts?: {posts?: Record<string, PostInfo>};
        files?: {
            files?: Record<string, FileInfo>;
            fileIdsByPostId?: Record<string, string[]>;
        };
    };
}

export interface MattermostStore {
    getState(): MattermostState;
    subscribe(listener: () => void): () => void;
}

export interface PostAttachmentProps {
    postId: string;
    onHeightChange?: () => void;
}

export interface FilePreviewProps {
    fileInfo: FileInfo;
}

export interface PluginRegistry {
    registerPostMessageAttachmentComponent(component: ComponentType<PostAttachmentProps>): string;
    registerFilePreviewComponent(
        match: (fileInfo: FileInfo) => boolean,
        component: ComponentType<FilePreviewProps>,
    ): string;
}
