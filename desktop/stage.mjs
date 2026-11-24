import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevelPages } from '../tools/build-level-pages.mjs';

const desktop = dirname(fileURLToPath(import.meta.url));
const root = resolve(desktop, '..');
const destination = join(root, 'output', 'windows-game');
const sourceOnly = new Set(['assets/sprite-sources', 'assets/vendor/vdoninja']);
const script = '<script src="./buergeramt-local-link.js"></script>';
const localFont = '<style>@font-face{font-family:UnifrakturCook;font-style:normal;font-weight:700;font-display:swap;src:url("./assets/vendor/unifrakturcook/25/UnifrakturCook-700.woff2") format("woff2")}</style>';

function includeRuntime(path) {
  if (sourceOnly.has(path)) return false;
  if (path === 'For-AI') return true;
  if (path.startsWith('For-AI/')) return /^For-AI\/(AUDIO-TEXT-LIBRARY|QUIZ-CHARACTER-DICTIONARY)\.js$/.test(path);
  if (path.includes('/')) return true;
  return path === 'assets' || path === 'labor' || path === 'berghain' || path === 'CREDITS.md'
    || /^(index|3d|buergeramt-phone)\.html$/.test(path)
    || /\.(js|css)$/.test(path) && !/preview|character-review/.test(path);
}

function offlineHtml(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'assets') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      offlineHtml(path);
    } else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8')
        .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/[^"]+"[^>]*>/g, localFont)
        .replace(/<script src="\.\/assets\/vendor\/vdoninja\/[^"]+"><\/script>/g, '')
        .replace(/(?=<script src="\.\/buergeramt-time\.js)/, script);
      writeFileSync(path, html);
    }
  }
}

mkdirSync(dirname(destination), { recursive: true });
if (realpathSync(dirname(destination)) !== join(realpathSync(root), 'output')) {
  throw new Error('The Windows staging directory must be inside the repository output folder.');
}
const staging = mkdtempSync(join(dirname(destination), 'windows-stage-'));
try {
  buildLevelPages(root, staging, includeRuntime);
  cpSync(join(desktop, 'buergeramt-local-link.js'), join(staging, 'buergeramt-local-link.js'));
  offlineHtml(staging);
  rmSync(destination, { recursive: true, force: true });
  renameSync(staging, destination);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
console.log('Staged the offline Windows game and companion.');
