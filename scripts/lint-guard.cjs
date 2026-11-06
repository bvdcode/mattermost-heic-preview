'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'webapp', 'src');
const stack = [root];
while (stack.length) {
    const current = stack.pop();
    for (const item of fs.readdirSync(current, {withFileTypes: true})) {
        const target = path.join(current, item.name);
        if (item.isDirectory()) {
            stack.push(target);
            continue;
        }
        if (!/\.(tsx?|css)$/.test(item.name)) {
            continue;
        }
        const content = fs.readFileSync(target, 'utf8');
        if (/\b100(?:d?vh|d?vw)\b/i.test(content)) {
            throw new Error(`Forbidden viewport sizing in ${target}`);
        }
        if (/\blocalStorage\b/.test(content)) {
            throw new Error(`Storage is not allowed in ${target}`);
        }
        const meaningfulLines = content.split('\n').filter((line) => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('*');
        });
        if (meaningfulLines.length > 400) {
            throw new Error(`Source exceeds 400 nonblank noncomment lines: ${target}`);
        }
    }
}
