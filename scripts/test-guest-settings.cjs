const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function settings(blockStorage, guest = true) {
  const slots = [], themes = [], events = [], storage = new Map();
  const timers = new Map();
  let index = 0, refIndex = 0, timerId = 0, tree, requests = 0;
  const refs = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/components/QuickSettings.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const document = { documentElement: {} };
  vm.runInNewContext(code, { module, exports: module.exports, document,
    window: {
      dispatchEvent: (event) => events.push(event),
      setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; },
      clearTimeout: (id) => timers.delete(id),
    },
    CustomEvent: function (type, options) { this.type = type; this.detail = options.detail; },
    localStorage: { setItem(key, value) { if (blockStorage) throw Error('blocked'); storage.set(key, value); } },
    fetch: async () => { requests++; return { ok: true }; },
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
  function render() { index = 0; refIndex = 0; tree = module.exports.default({ guest, initialTheme: 'system', initialLanguage: 'en' }); }
  function nodes(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]; }
  render();
  return { themes, events, storage, document, requests: () => requests,
    nodes: () => nodes(tree),
    timerCount: () => timers.size,
    async event(predicate, handlerName) { const node = nodes(tree).find(predicate); assert.ok(node); await node.props[handlerName]({ currentTarget: { contains: () => false }, relatedTarget: null }); render(); },
    runTimers() { const pending = [...timers.values()]; timers.clear(); for (const callback of pending) callback(); render(); },
    async click(predicate) { const node = nodes(tree).find(predicate); assert.ok(node); await node.props.onClick(); await Promise.resolve(); await Promise.resolve(); render(); },
  };
}
for (const blocked of [false, true]) test(`guest theme/language work without member APIs (storage blocked: ${blocked})`, async () => {
  const app = settings(blocked);
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  assert.equal(app.nodes().filter((n) => n.props?.href).length, 0, 'No Help or Settings links');
  await app.click((n) => n.props?.title === 'Dark');
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')), 'Orb starts exit animation after theme action');
  app.runTimers();
  assert.equal(app.nodes().some((n) => n.props?.title === 'Dark'), false, 'Orb closes after theme exit animation');
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  await app.click((n) => n.type === 'button' && n.props.children === 'Deutsch');
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')), 'Orb starts exit animation after language action');
  app.runTimers();
  assert.equal(app.nodes().some((n) => n.type === 'button' && n.props.children === 'Deutsch'), false, 'Orb closes after language exit animation');
  assert.deepEqual(app.themes, ['dark']);
  assert.equal(app.document.documentElement.lang, 'de');
  assert.equal(app.events[0].detail, 'de');
  assert.equal(app.requests(), 0);
  if (!blocked) { assert.equal(app.storage.get('theme'), 'dark'); assert.equal(app.storage.get('vibe-language'), 'de'); }
});


test('quick settings auto-closes after being opened', async () => {
  const app = settings(false);
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  assert.ok(app.nodes().some((n) => n.props?.title === 'Dark'));
  app.runTimers();
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')));
  app.runTimers();
  assert.equal(app.nodes().some((n) => n.props?.title === 'Dark'), false);
});


test('quick settings close animation mirrors the enter motion', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf8');
  assert.match(css, /@keyframes vibe-quick-settings-enter/);
  assert.match(css, /@keyframes vibe-quick-settings-exit/);
  assert.match(css, /vibe-quick-settings-panel-exit/);
  assert.ok(css.includes('translateY(-0.35rem) scale(0.97)'));
});


test('quick settings pauses auto-close while hovered', async () => {
  const app = settings(false);
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  assert.equal(app.timerCount(), 1);
  await app.event((n) => n.props?.['data-vibe-quick-settings'] !== undefined, 'onPointerEnter');
  assert.equal(app.timerCount(), 0);
  app.runTimers();
  assert.ok(app.nodes().some((n) => n.props?.title === 'Dark'));
  await app.event((n) => n.props?.['data-vibe-quick-settings'] !== undefined, 'onPointerLeave');
  assert.equal(app.timerCount(), 1);
  app.runTimers();
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')));
});


test('quick settings waits for saved pill to hide before closing', async () => {
  const app = settings(false, false);
  await app.click((n) => n.props?.['aria-label'] === 'Quick settings');
  await app.click((n) => n.props?.title === 'Dark');
  assert.ok(app.nodes().some((n) => n.props?.role === 'status' && String(n.props?.className ?? '').includes('vibe-quick-settings-feedback-saved')));
  assert.equal(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')), false);
  app.runTimers();
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-feedback-exit')));
  assert.equal(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')), false);
  app.runTimers();
  assert.ok(app.nodes().some((n) => String(n.props?.className ?? '').includes('vibe-quick-settings-panel-exit')));
});
