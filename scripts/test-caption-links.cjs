const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, requireMock = () => ({}), globals = {}) {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: m, exports: m.exports, require: requireMock, URL, ...globals });
  return m.exports;
}
const { captionParts } = load('src/caption-links.ts');
test('mixed captions preserve text and distinguish URLs from mentions', () => {
  const text = 'Hi @Violett.ai.2025!\nSee https://example.com/@someone?q=1 and www.example.org.';
  const parts = captionParts(text);
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.deepEqual(Array.from(parts.filter(p => p.href), p => p.href), ['/profile/Violett.ai.2025', 'https://example.com/@someone?q=1', 'https://www.example.org/']);
});
test('punctuation and balanced URL parentheses stay outside or inside as appropriate', () => {
  const text = '(https://example.com/wiki/Test_(thing)). @user1, @ä🌸';
  const parts = captionParts(text);
  assert.equal(parts.map(p => p.text).join(''), text);
  assert.equal(parts.find(p => p.external).href, 'https://example.com/wiki/Test_(thing)');
  assert.equal(parts.filter(p => p.href).length, 3);
});
test('email, unsafe schemes, credentials and malformed links remain plain text', () => {
  for (const text of ['user@example.com', 'javascript:alert(1)', 'javascript:https://example.com', 'https://user:password@example.com', 'https://', 'www.', '<script>alert(1)</script>']) {
    const parts = captionParts(text);
    assert.equal(parts.map(p => p.text).join(''), text);
    assert.equal(parts.some(p => p.href), false, text);
  }
});
test('choosing a suggestion updates the controlled caption and preserves trailing text', () => {
  let next, index = 0;
  const profile = { id: '1', username: 'user1', name: 'User One', avatar: null };
  const slots = ['', 5, [profile], false];
  const react = {
    forwardRef: fn => fn, useEffect() {}, useMemo: fn => fn(), useRef: () => ({ current: null }),
    useState: initial => { const i = index++; return [slots[i] ?? initial, v => { slots[i] = v; }]; },
  };
  const component = load('src/app/components/MentionTextarea.tsx', name => name === 'react' ? react : { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }, { requestAnimationFrame: fn => fn() }).default;
  const tree = component({ value: 'Hi @u rest', onValueChange: value => { next = value; } });
  const nodes = n => !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(nodes) : [n, ...nodes(n.props?.children)];
  const option = nodes(tree).find(n => n.type === 'button');
  assert.ok(option);
  option.props.onClick();
  assert.equal(next, 'Hi @user1  rest');
  assert.match(fs.readFileSync('src/app/components/PostComposer.tsx', 'utf8'), /onValueChange=\{setDraftDescription\}/);
});

test('suggestion lookup failures and malformed responses leave text untouched', async () => {
  for (const scenario of ['offline', 'invalid', 'timeout', 'stale']) {
    let index = 0, changed = false;
    const slots = ['', 2, [], false], effects = [], timers = [];
    const react = {
      forwardRef: fn => fn, useEffect: fn => effects.push(fn), useMemo: fn => fn(), useRef: () => ({ current: null }),
      useState: initial => { const i = index++; return [slots[i] ?? initial, v => { slots[i] = v; }]; },
    };
    let complete;
    const component = load('src/app/components/MentionTextarea.tsx', name => name === 'react' ? react : { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }, {
      AbortController,
      window: { setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {} },
      fetch: async () => {
        if (scenario === 'offline') throw new Error('offline');
        if (scenario === 'invalid') return { ok: true, json: async () => ({ error: 'invalid' }) };
        return new Promise(resolve => { complete = () => resolve({ ok: true, json: async () => [{ id: '1', username: 'user1', name: null, avatar: null }] }); });
      },
    }).default;
    component({ value: '@u', onValueChange: () => { changed = true; } });
    const cleanup = effects[1]();
    const lookup = timers.find(t => t.delay === 180).fn();
    if (scenario === 'timeout') timers.find(t => t.delay === 8000).fn();
    if (scenario === 'stale') cleanup();
    complete?.();
    await lookup;
    assert.equal(slots[2].length, 0, scenario);
    if (scenario !== 'stale') assert.equal(slots[3], false, scenario);
    assert.equal(changed, false, scenario);
    cleanup();
  }
});
