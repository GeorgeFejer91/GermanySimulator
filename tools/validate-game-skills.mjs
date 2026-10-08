import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.agents/skill-sources.json'), 'utf8'));
const routes = fs.readFileSync(path.join(root, 'For-AI/SKILLS.md'), 'utf8');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const withinRoot = target => target === root || target.startsWith(root + path.sep);

function exactFile(target) {
  assert(withinRoot(target), 'Reference escapes workspace: ' + target);
  let current = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    assert(fs.readdirSync(current).includes(part), 'Missing or wrong-case path: ' + target);
    current = path.join(current, part);
    assert(!fs.lstatSync(current).isSymbolicLink(), 'Unexpected symbolic link: ' + current);
  }
  assert(fs.statSync(current).isFile(), 'Expected file: ' + target);
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), 'Unexpected symbolic link: ' + target);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}

function prose(text) {
  // ponytail: inspect inline links only; use a Markdown parser if reference syntax expands.
  let fence = null;
  return text.split(/\r?\n/).filter(line => {
    const match = line.trimStart().match(/^(`{3,}|~{3,})/);
    if (match) {
      if (!fence) fence = match[1][0];
      else if (fence === match[1][0]) fence = null;
      return false;
    }
    return !fence;
  }).join('\n');
}

let fileCount = 0;
let referenceCount = 0;
assert(manifest.schemaVersion === 1 && Array.isArray(manifest.skills) && manifest.skills.length, 'Invalid or empty manifest');
const names = new Set();
for (const skill of manifest.skills) {
  assert(!names.has(skill.name), 'Duplicate skill: ' + skill.name);
  names.add(skill.name);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name), 'Invalid skill name');
  assert(/^[0-9a-f]{40}$/.test(skill.source.commit), 'Source must be an immutable commit');
  assert(skill.installedPath === '.agents/skills/' + skill.name, 'Unexpected destination');
  assert(skill.license.id && skill.license.attribution && skill.adaptations.length, 'Missing license/attribution/adaptations');
  assert(routes.includes('$' + skill.name), 'Skill missing from task routing: ' + skill.name);
  const bundle = path.resolve(root, skill.installedPath);
  const actual = listFiles(bundle).map(file => path.relative(bundle, file).split(path.sep).join('/')).sort();
  const declared = skill.files.map(file => file.path).sort();
  assert(JSON.stringify(actual) === JSON.stringify(declared), 'Unexpected or missing files: ' + skill.name);
  for (const file of skill.files) {
    const target = path.resolve(bundle, file.path);
    assert(target.startsWith(bundle + path.sep), 'Manifest path escapes bundle');
    exactFile(target);
    assert(hash(fs.readFileSync(target)) === file.installedSha256, 'Content hash mismatch: ' + target);
    if (file.upstreamPath) assert(/^[0-9a-f]{64}$/.test(file.upstreamSha256), 'Missing upstream content hash');
    fileCount++;
    if (!file.path.endsWith('.md')) continue;
    const text = fs.readFileSync(target, 'utf8');
    for (const match of prose(text).matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = match[1];
      if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const relative = decodeURIComponent(href.split(/[?#]/, 1)[0]);
      assert(relative && !relative.startsWith('/'), 'Unexpected absolute Markdown reference: ' + href);
      exactFile(path.resolve(path.dirname(target), relative));
      referenceCount++;
    }
  }
  exactFile(path.join(bundle, skill.license.installedPath));
  const source = fs.readFileSync(path.join(bundle, 'SOURCE.md'), 'utf8');
  assert(source.includes(skill.source.commit) && source.includes(skill.license.id), 'Incomplete source record');
  const entry = fs.readFileSync(path.join(bundle, 'SKILL.md'), 'utf8');
  const header = entry.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert(header, 'Missing frontmatter: ' + skill.name);
  const name = header[1].match(/^name:\s*['"]?([a-z0-9-]+)['"]?\s*$/m);
  assert(name && name[1] === skill.name && /^description:\s*\S/m.test(header[1]), 'Invalid discovery fields: ' + skill.name);
  assert(!/^(effort|model):/m.test(header[1]), 'Unexpected model/effort override');
  const metadata = path.join(bundle, 'agents/openai.yaml');
  if (fs.existsSync(metadata)) {
    for (const icon of fs.readFileSync(metadata, 'utf8').matchAll(/^\s*icon_(?:small|large):\s*["']?([^"'\s]+)["']?\s*$/gm)) {
      exactFile(path.resolve(bundle, icon[1]));
      referenceCount++;
    }
  }
}
console.log('PASS: ' + names.size + ' pinned skill bundles, ' + fileCount + ' hashed files, ' + referenceCount + ' local references.');
console.log('Checks cover integrity, basic discovery fields, notices and local references; workflow effectiveness remains NOT RUN.');
