import React from 'react';

import type {MattermostStore, PluginRegistry, PostAttachmentProps} from './model';
import {isHeic} from './file-info';
import InlinePost from './inline';
import {PLUGIN_ID} from './paths';
import HeicFilePreview from './preview';
import './styles.css';

class HeicPreviewPlugin {
    initialize(registry: PluginRegistry, store: MattermostStore): void {
        registry.registerPostMessageAttachmentComponent((props: PostAttachmentProps) => (
            <InlinePost {...props} store={store}/>
        ));
        registry.registerFilePreviewComponent(isHeic, HeicFilePreview);
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: HeicPreviewPlugin): void;
    }
}

window.registerPlugin(PLUGIN_ID, new HeicPreviewPlugin());
