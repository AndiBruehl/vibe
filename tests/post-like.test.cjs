const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise each real click handler with a deliberately unresolved server request.
function fixture(native = false, liked = false) {
  const slots = [];
  let cursor = 0;
  let resolve, reject;
  let calls = 0;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  const save = () => { calls++; return promise; };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  };
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/actions": { togglePostLike: save }, "lucide-react": { Heart: "Heart" },
    "react-native": { Pressable: "Pressable", Text: "Text", View: "View" },
    "@expo/vector-icons": { Ionicons: "Ionicons" },
    "@/lib/api": { api: { setPostLiked: save } },
    "@/theme": { colors: { red: "red", muted: "gray", textSoft: "gray" } },
  };
  const file = native ? "android-app/src/components/PostLikeButton.tsx" : "src/app/components/LikeButton.tsx";
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, FormData, require: name => {
    assert.ok(name in mocks, `Unexpected dependency ${name}`); return mocks[name];
  } });
  const props = native ? { post: { id: "post", liked, likesCount: 4 } } : { postId: "post", initialLiked: liked, initialLikes: 4 };
  const render = () => { cursor = 0; return exports.default(props); };
  const click = () => {
    const tree = render();
    const button = tree.props.children[0];
    native ? button.props.onPress({ stopPropagation() {} }) : button.props.onClick();
  };
  return { render, click, resolve, reject, slots, calls: () => calls };
}

for (const native of [false, true]) {
  const name = native ? "Android" : "Web";
  const options = { skip: native && !fs.existsSync("android-app/src/components/PostLikeButton.tsx") ? "Local Android implementation is not present" : false };
  test(`${name}: updates heart/count before the server returns and ignores double clicks`, options, async () => {
    const f = fixture(native);
    f.click();
    assert.equal(f.slots[0].liked, true);
    assert.equal(f.slots[0].likes, 5);
    f.click();
    assert.equal(f.calls(), 1);
    f.resolve({ liked: true, likes: 7 });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.slots[0].liked, true);
    assert.equal(f.slots[0].likes, 7);
  });
  test(`${name}: unlike is immediate and failure restores the previous state`, options, async () => {
    const f = fixture(native, true);
    f.click();
    assert.equal(f.slots[0].liked, false);
    assert.equal(f.slots[0].likes, 3);
    f.reject(new Error("Offline"));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.slots[0].liked, true);
    assert.equal(f.slots[0].likes, 4);
  });
}
