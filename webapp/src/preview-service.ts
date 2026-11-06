import {HeicDecoder} from 'heic-net';

import type {FileInfo} from './model';
import {getSiteBasePath, resourceUrls} from './paths';

const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;
const MAX_PREVIEW_SIDE = 1920;
const JPEG_QUALITY = 0.84;

export class PreviewService {
    private decoder: HeicDecoder | null = null;
    private readonly basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    originalUrl(file: FileInfo): string {
        return resourceUrls(this.basePath, file.id).original;
    }

    async decode(file: FileInfo, signal: AbortSignal): Promise<Blob> {
        const response = await fetch(this.originalUrl(file), {credentials: 'same-origin', signal});
        if (!response.ok) {
            throw new Error(`File request failed (${response.status})`);
        }
        const declaredLength = Number(response.headers.get('content-length') ?? '0');
        if (declaredLength > MAX_FILE_BYTES) {
            throw new Error('HEIC file exceeds the maximum size');
        }
        const original = await response.blob();
        if (original.size > MAX_FILE_BYTES || signal.aborted) {
            throw new Error('HEIC download was interrupted or exceeds the maximum size');
        }
        if (!this.decoder) {
            this.decoder = new HeicDecoder({
                assetsUrl: resourceUrls(this.basePath, file.id).runtime,
                maxPixels: MAX_PIXELS,
            });
        }
        const image = await this.decoder.decode(original);
        if (signal.aborted) {
            throw new Error('HEIC request was cancelled');
        }
        return this.toJpeg(image.pixels, image.width, image.height);
    }

    private toJpeg(pixels: Uint8ClampedArray<ArrayBuffer>, width: number, height: number): Promise<Blob> {
        if (width <= 0 || height <= 0 || width * height > MAX_PIXELS) {
            throw new Error('HEIC image dimensions are invalid');
        }
        const full = document.createElement('canvas');
        full.width = width;
        full.height = height;
        const ctx = full.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D is unavailable');
        }
        ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
        const scale = Math.min(1, MAX_PREVIEW_SIDE / Math.max(width, height));
        const preview = document.createElement('canvas');
        preview.width = Math.max(1, Math.round(width * scale));
        preview.height = Math.max(1, Math.round(height * scale));
        const previewCtx = preview.getContext('2d');
        if (!previewCtx) {
            throw new Error('Canvas 2D is unavailable');
        }
        previewCtx.drawImage(full, 0, 0, preview.width, preview.height);
        full.width = 0;
        full.height = 0;
        return new Promise<Blob>((resolve, reject) => {
            preview.toBlob((blob) => {
                preview.width = 0;
                preview.height = 0;
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('JPEG encoding failed'));
                }
            }, 'image/jpeg', JPEG_QUALITY);
        });
    }
}

let previewService: PreviewService | null = null;

export function getPreviewService(): PreviewService {
    if (!previewService) {
        previewService = new PreviewService(getSiteBasePath());
    }
    return previewService;
}
