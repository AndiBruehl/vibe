const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run the real component's hooks and event handlers with a deterministic clock.
function editor(fetchImpl, storage = new Map()) {
  const slots = [], effects = [], timers = new Map(), requests = [];
  let index = 0, clock = 0, nextTimer = 0, tree, changed;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const setTimeout = (fn, delay = 0) => { timers.set(++nextTimer, { fn, at: clock + delay }); return nextTimer; };
  const clearTimeout = (id) => timers.delete(id);
  const react = {
    useState: (initial) => { const i = index++; if (!slots[i]) slots[i] = { value: initial }; return [slots[i].value, (v) => { const next = typeof v === 'function' ? v(slots[i].value) : v; if (!Object.is(next, slots[i].value)) { slots[i].value = next; changed = true; } }]; },
    useRef: (initial) => { const i = index++; return slots[i] ?? (slots[i] = { current: initial }); },
    useMemo: (fn, deps) => { const i = index++; if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffect: (fn, deps) => { const i = index++; if (!slots[i] || !same(slots[i].deps, deps)) { const previous = slots[i]; slots[i] = { deps, effect: true }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  react.useCallback = (fn, deps) => react.useMemo(() => fn, deps);
  const router = { refresh() {} };
  const module = { exports: {} };
  const window = { setTimeout, clearTimeout, addEventListener() {}, removeEventListener() {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/components/LocationSharingSettings.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, window, setTimeout, clearTimeout, AbortController, navigator: {},
    sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    fetch: async (_url, options) => { const payload = JSON.parse(options.body); requests.push(payload); return fetchImpl(payload, options.signal); },
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === 'next/navigation') return { useRouter: () => router };
      if (name === 'lucide-react') return {};
      return { default: name };
    },
  });
  const props = { profileId: 'test', language: 'en', initialEnabled: true, initialPrecision: 'exact', initialLatitude: 51, initialLongitude: 11 };
  function render() { let count = 0; do { changed = false; index = 0; tree = module.exports.default(props); while (effects.length) effects.shift()(); if (++count > 20) throw Error('render loop'); } while (changed); }
  function nodes(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]; }
  function text(node) { if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' && node ? text(node.props?.children) : typeof node === 'string' ? node : ''; }
  async function flush() { for (let i = 0; i < 5; i++) { await new Promise(setImmediate); render(); } }
  render();
  return {
    requests, storage, flush,
    input: (i) => nodes(tree).filter((n) => n.type === 'input')[i],
    change: (i, value) => { nodes(tree).filter((n) => n.type === 'input')[i].props.onChange({ target: { value } }); render(); },
    click: (label) => { const node = nodes(tree).find((n) => n.type === 'button' && text(n).includes(label)); assert.ok(node, label); node.props.onClick(); render(); },
    text: () => text(tree),
    async advance(ms) { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); } await flush(); },
    unmount: () => slots.forEach((slot) => slot?.effect && slot.cleanup?.()),
  };
}
const success = (body) => ({ ok: true, json: async () => ({ ok: true, latitude: body.latitude, longitude: body.longitude, resolvedAddress: body.address, updatedAt: '2026-09-29T10:00:00Z' }) });

test('a stalled response body times out and releases saving state', async () => {
  const app = editor(async (_payload, signal) => ({ ok: true, json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('timeout')))) }));
  app.click('Choose a custom'); app.change(1, '52'); await app.advance(2000);
  await app.advance(16000);
  assert.match(app.text(), /Could not confirm saving/);
  assert.equal(app.input(1).props.value, '52');
});

test('malformed save data preserves the draft instead of clearing inputs', async () => {
  const app = editor(async () => ({ ok: true, json: async () => ({ ok: true, latitude: 999, longitude: 11 }) }));
  app.click('Choose a custom'); app.change(1, '52'); await app.advance(2000);
  assert.match(app.text(), /Could not confirm saving/);
  assert.equal(app.input(1).props.value, '52');
  assert.ok(app.storage.size);
});

test('malformed candidates show lookup fallback without crashing or publishing', async () => {
  const app = editor(async () => ({ ok: true, json: async () => ({ candidates: [null, { label: 'bad', latitude: 999, longitude: 11 }] }) }));
  app.click('Choose a custom'); app.change(0, 'Hell'); app.click('Find places'); await app.flush();
  assert.match(app.text(), /Place search is currently unavailable/);
  assert.equal(app.requests.length, 1);
  assert.equal(app.input(0).props.value, 'Hell');
});
test('rapid address edits do not publish and empty coordinates stay empty', async () => {
  const app = editor(async (p) => success(p));
  app.click('Choose a custom'); app.change(0, 'Hel'); app.change(0, 'Hell');
  await app.advance(2500);
  assert.equal(app.requests.length, 0);
  assert.equal(app.input(1).props.value, '');
  app.change(1, '51'); app.change(2, '11'); app.change(1, '');
  await app.advance(2500);
  assert.equal(app.requests.length, 0);
  assert.equal(app.input(1).props.value, '');
});
test('a selected result autosaves once and responses do not restart saving', async () => {
  const app = editor(async (p) => p.action === 'search' ? { ok: true, json: async () => ({ candidates: [{ label: 'Hell, Norway', latitude: 63.4, longitude: 10.9 }] }) } : success(p));
  app.click('Choose a custom'); app.change(0, 'Hell'); app.click('Find places'); await app.flush();
  assert.equal(app.requests.length, 1);
  app.click('Hell, Norway'); await app.advance(2000); await app.advance(3000);
  assert.equal(app.requests.length, 2);
  assert.equal(app.requests[1].latitude, 63.4);
});
test('a late save cannot overwrite newer input', async () => {
  let resolve;
  const app = editor((p) => new Promise((r) => { resolve = () => r(success(p)); }));
  app.click('Choose a custom'); app.change(1, '52'); await app.advance(2000);
  app.change(0, 'New location'); resolve(); await app.flush();
  assert.equal(app.input(0).props.value, 'New location');
  assert.equal(app.input(1).props.value, '');
});
test('network failure preserves input and offers retry', async () => {
  const app = editor(async () => { throw Error('offline'); });
  app.click('Choose a custom'); app.change(1, '52'); await app.advance(2000);
  assert.equal(app.input(1).props.value, '52');
  assert.match(app.text(), /Could not confirm saving/);
  assert.ok(app.storage.size);
});
test('navigation restores unfinished input without silently publishing it', async () => {
  const storage = new Map();
  const app = editor(async (p) => success(p), storage);
  app.click('Choose a custom'); app.change(0, 'Unfinished address'); app.unmount();
  const next = editor(async (p) => success(p), storage);
  await next.advance(0); await next.advance(3000);
  assert.equal(next.input(0).props.value, 'Unfinished address');
  assert.equal(next.requests.length, 0);
  assert.match(next.text(), /restored/);
});
