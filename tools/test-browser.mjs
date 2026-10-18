import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runSuite, isMain} from './browser-harness.mjs';

export async function main(args = process.argv.slice(2)) {
  const {values, positionals} = parseArgs({args, allowPositionals: true, options: {
    suite: {type: 'string', default: './tools/browser-game-suite.mjs'},
    'base-url': {type: 'string'}, root: {type: 'string'}, output: {type: 'string'},
    scenario: {type: 'string', multiple: true}, profile: {type: 'string', multiple: true},
    seed: {type: 'string', default: '1'}, iterations: {type: 'string', default: '10'},
    trace: {type: 'boolean'}, help: {type: 'boolean'}
  }});
  if (values.help) {
    process.stdout.write('node tools/test-browser.mjs quick|stress [--suite module.mjs] [--scenario id] [--profile id] [--seed uint32] [--iterations n] [--base-url URL | --root directory] [--output directory] [--trace]\n');
    return 0;
  }
  if (positionals.length > 1) throw Error('Expected one mode: quick or stress');
  if (values.root && values['base-url']) throw Error('Choose --root or --base-url');
  const suitePath = resolve(values.suite);
  const suite = (await import(pathToFileURL(suitePath))).default;
  const report = await runSuite(suite, {mode: positionals[0] || 'quick', suitePath,
    root: values.root, baseURL: values['base-url'], output: values.output,
    scenarios: values.scenario, profiles: values.profile, seed: Number(values.seed),
    iterations: Number(values.iterations), trace: values.trace});
  return report.verdict === 'PASS' ? 0 : 1;
}

if (isMain(import.meta.url)) {
  main().then(code => { process.exitCode = code; }, error => {
    process.stderr.write(error.message.slice(0, 2000) + '\n'); process.exitCode = 2;
  });
}
