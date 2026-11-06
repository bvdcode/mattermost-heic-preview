import type {FileInfo} from './model';

const HIDDEN_CLASS = 'bvd-heic-native-hidden';

export function parseDownloadFileId(href: string): string | null {
    const url = new URL(href, 'http://localhost');
    const match = /\/api\/v4\/files\/([A-Za-z0-9]+)(?:\/download)?\/?$/.exec(url.pathname);
    return match?.[1] ?? null;
}

export function findNativeCard(post: Element, file: FileInfo): HTMLElement | null {
    const anchors = post.querySelectorAll<HTMLAnchorElement>('.post-image__column .post-image__download a[download]');
    for (const anchor of anchors) {
        if (parseDownloadFileId(anchor.href) === file.id && anchor.download === file.name) {
            return anchor.closest<HTMLElement>('.post-image__column');
        }
    }
    return null;
}

export function hideNativeCard(element: Element, file: FileInfo): () => void {
    const post = element.closest('.post');
    if (!post) {
        return () => undefined;
    }
    const hidden = new Map<HTMLElement, string | null>();
    const update = (): void => {
        const card = findNativeCard(post, file);
        if (card && !hidden.has(card)) {
            hidden.set(card, card.getAttribute('aria-hidden'));
            card.classList.add(HIDDEN_CLASS);
            card.setAttribute('aria-hidden', 'true');
        }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(post, {childList: true, subtree: true});
    return () => {
        observer.disconnect();
        for (const [card, ariaHidden] of hidden) {
            card.classList.remove(HIDDEN_CLASS);
            if (ariaHidden === null) {
                card.removeAttribute('aria-hidden');
            } else {
                card.setAttribute('aria-hidden', ariaHidden);
            }
        }
    };
}

export function openNativePreview(element: Element, file: FileInfo): boolean {
    const post = element.closest('.post');
    const card = post && findNativeCard(post, file);
    const trigger = card?.querySelector<HTMLAnchorElement>('a.post-image__thumbnail');
    if (!trigger) {
        return false;
    }
    trigger.click();
    return true;
}
