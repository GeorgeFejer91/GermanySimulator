import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function buildPhonePwa(output) {
  const phone = readFileSync(join(output, 'buergeramt-phone.html'), 'utf8')
    .replace('<head>', '<head><base href="../">')
    .replace(/<script src="\.\/assets\/vendor\/vdoninja\/[^"]+"><\/script>/, '<script src="./phone/companion.js"></script>');
  writeFileSync(join(output, 'phone', 'companion.html'), phone);

  function tree(path, skip = /$^/) {
    return readdirSync(join(output, path), { withFileTypes: true }).flatMap(entry => {
      const item = path + '/' + entry.name;
      return entry.isDirectory() ? tree(item, skip) : skip.test(item) ? [] : [item];
    });
  }
  const assets = [
    ...tree('phone', /\/(offline-files\.js)$/),
    'buergeramt.css', 'buergeramt-fit.js', 'buergeramt-link.js', 'buergeramt-time.js',
    'buergeramt-phone.js', 'fullscreen.js', 'knick-speech.js', 'knick-speech-worker.js',
    'For-AI/AUDIO-TEXT-LIBRARY.js',
    ...tree('assets/vendor/pretext/dist'),
    ...tree('assets/voices/kriminalpolizei', /\.md$|LICENSE/),
    ...tree('assets/vendor/onnxruntime/1.18.0', /LICENSE/),
    ...tree('assets/vendor/piper-phonemize/1.0.0', /\.md$|LICENSE|COPYING/)
  ].sort();
  const hash = createHash('sha256');
  for (const asset of assets) hash.update(asset).update(readFileSync(join(output, asset)));
  const version = hash.digest('hex').slice(0, 16);
  const urls = ['./', ...assets.map(asset => '../' + asset)];
  writeFileSync(join(output, 'phone', 'offline-files.js'),
    `const AMT_CACHE = "buergeramt-phone-${version}";\nconst AMT_OFFLINE_FILES = ${JSON.stringify(urls)};\n`);
}
