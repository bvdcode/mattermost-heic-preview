import React from 'react';

import type {FilePreviewProps} from './model';
import {getPreviewService} from './preview-service';
import {usePreviewUrl} from './preview-url';
import {currentLocale, translate} from './i18n';

export default function HeicFilePreview({fileInfo}: FilePreviewProps): React.ReactElement {
    const preview = usePreviewUrl(fileInfo, true);
    const locale = currentLocale();
    return (
        <div className='bvd-heic-modal'>
            {preview.status === 'loading' && <span role='status'>{translate('loading', locale)}</span>}
            {preview.status === 'failed' && <p role='alert'>{translate('failed', locale)}</p>}
            {preview.url && <img className='bvd-heic-modal__image' alt={fileInfo.name} src={preview.url}/>}
            <a href={getPreviewService().originalUrl(fileInfo)} download={fileInfo.name}>
                {translate('download', locale)}
            </a>
        </div>
    );
}
