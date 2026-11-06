import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';

import type {FileInfo, MattermostStore, PostAttachmentProps} from './model';
import {getHeicFilesForPost} from './file-info';
import {hideNativeCard, openNativePreview} from './native-card';
import {getPreviewService} from './preview-service';
import {usePreviewUrl} from './preview-url';

interface InlineFileProps {
    file: FileInfo;
    onHeightChange?: (height: number) => void;
}

function InlineFile({file, onHeightChange}: InlineFileProps): React.ReactElement {
    const element = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const preview = usePreviewUrl(file, visible);

    useEffect(() => {
        const node = element.current;
        if (!node) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setVisible(true);
                observer.disconnect();
            }
        }, {rootMargin: '400px'});
        observer.observe(node);
        return () => observer.disconnect();
    }, [file.id]);

    useEffect(() => {
        const node = element.current;
        if (!node || preview.status !== 'ready') {
            return;
        }
        const restore = hideNativeCard(node, file);
        onHeightChange?.(1);
        return () => {
            restore();
            onHeightChange?.(1);
        };
    }, [file.id, onHeightChange, preview.status]);

    const showPreview = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        if (element.current && openNativePreview(element.current, file)) {
            event.preventDefault();
        }
    };

    return (
        <div className='bvd-heic-inline' ref={element} data-heic-file-id={file.id}>
            {preview.url && (
                <a
                    className='bvd-heic-inline__link'
                    href={getPreviewService().originalUrl(file)}
                    onClick={showPreview}
                >
                    <img className='bvd-heic-inline__image' alt={file.name} src={preview.url}/>
                </a>
            )}
        </div>
    );
}

interface InlinePostProps extends PostAttachmentProps {
    store: MattermostStore;
}

export default function InlinePost({postId, store, onHeightChange}: InlinePostProps): React.ReactElement | null {
    const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
    const files = getHeicFilesForPost(state, postId);
    if (files.length === 0) {
        return null;
    }
    return (
        <div className='bvd-heic-post'>
            {files.map((file) => <InlineFile key={file.id} file={file} onHeightChange={onHeightChange}/>)}
        </div>
    );
}
