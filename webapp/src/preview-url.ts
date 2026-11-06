import {useEffect, useState} from 'react';

import type {FileInfo} from './model';
import {getPreviewService} from './preview-service';

export interface PreviewState {
    url: string | null;
    status: 'loading' | 'ready' | 'failed';
}

export function usePreviewUrl(file: FileInfo, enabled: boolean): PreviewState {
    const [state, setState] = useState<PreviewState>({url: null, status: 'loading'});
    useEffect(() => {
        if (!enabled) {
            return;
        }
        const controller = new AbortController();
        let active = true;
        let objectUrl: string | null = null;
        setState({url: null, status: 'loading'});
        getPreviewService().decode(file, controller.signal).then((blob) => {
            if (!active) {
                return;
            }
            objectUrl = URL.createObjectURL(blob);
            setState({url: objectUrl, status: 'ready'});
        }).catch(() => {
            if (active && !controller.signal.aborted) {
                setState({url: null, status: 'failed'});
            }
        });
        return () => {
            active = false;
            controller.abort();
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [enabled, file.id]);
    return state;
}
