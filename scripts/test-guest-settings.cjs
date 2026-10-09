const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function settings(blockStorage) {
  const slots = [], themes = [], events = [], storage = new Map();
  let index = 0, refIndex = 0, tree, requests = 0;
  const refs = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/components/QuickSettings.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const document = { documentElement: {} };
  vm.runInNewContext(code, { module, exports: module.exports, document,
    window: { dispatchEvent: (event) => events.push(event), setTimeout, clearTimeout },
    CustomEvent: function (type, options) { this.type = type; this.detail = options.detail; },
    localStorage: { setItem(key, value) { if (blockStorage) throw Error('blocked'); storage.set(key, value); } },
    fetch: async () => { requests++; throw Error('Guest must not call member API'); },
    require(name) {
      if (name === 'react') return {
        useState(value) { const i = index++; if (!(i in slots)) slots[i] = value; return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; },
        useEffect() {},
        useRef(value = null) { const i = refIndex++; if (!(i in refs)) refs[i] = { current: value }; return refs[i]; },
      };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === 'next/navigation') return { usePathname: () => '/home', useRouter: () => ({}) };
      if (name.includes('ProfileThemeRuntime')) return { applyTheme: (theme) => themes.push(theme) };
      return {};
    },
  });
  function render() { index = 0; refIndex = 0; tree = module.exports.default({ guest: true, initialTheme: 'system', initialLanguage: 'en' }); }
  function nodes(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]; }
  render();
  return { themes, events, storage, document, requests: () => requests,
    nodes: () => nodes(tree),
    async click(predicate) { const node = nodes(tree).find(predicate); assert.ok(node); await node.props.onClick(); render(); },
  };
}
for (const blocked of [false, true]) test(`guest theme/language work without member APIs (storage blocked: ${blocked})`, async () => {
  const app = settings(blocked);
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  assert.equal(app.nodes().filter((n) => n.props?.href).length, 0, 'No Help or Settings links');
  await app.click((n) => n.props?.title === 'Dark');
  assert.equal(app.nodes().some((n) => n.props?.title === 'Dark'), false, 'Orb closes after theme action');
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  await app.click((n) => n.type === 'button' && n.props.children === 'Deutsch');
  assert.equal(app.nodes().some((n) => n.type === 'button' && n.props.children === 'Deutsch'), false, 'Orb closes after language action');
  assert.deepEqual(app.themes, ['dark']);
  assert.equal(app.document.documentElement.lang, 'de');
  assert.equal(app.events[0].detail, 'de');
  assert.equal(app.requests(), 0);
  if (!blocked) { assert.equal(app.storage.get('theme'), 'dark'); assert.equal(app.storage.get('vibe-language'), 'de'); }
});
