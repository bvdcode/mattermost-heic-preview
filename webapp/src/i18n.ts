const messages = {
    en: {
        loading: 'Decoding HEIC image…',
        failed: 'This HEIC image could not be previewed.',
        download: 'Download original HEIC',
    },
    ru: {
        loading: 'Обрабатывается изображение HEIC…',
        failed: 'Не удалось показать изображение HEIC.',
        download: 'Скачать исходный HEIC',
    },
};

export type MessageKey = keyof typeof messages.en;

export function translate(key: MessageKey, locale: string): string {
    if (locale.toLowerCase().startsWith('ru')) {
        return messages.ru[key];
    }
    return messages.en[key];
}

export function currentLocale(): string {
    return document.documentElement.lang || navigator.language;
}
