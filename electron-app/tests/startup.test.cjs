const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function boot(singleInstance = true) {
  const windows = [], urls = [], files = [], external = [];
  let menu, quit = false;
  const app = Object.assign(new EventEmitter(), {
    isPackaged: true, setName() {}, requestSingleInstanceLock: () => singleInstance,
    quit: () => { quit = true; }, whenReady: () => Promise.resolve(),
    setAppLogsPath() {}, getPath: () => "test-logs", getVersion: () => "0.1.1", setAppUserModelId() {},
  });
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super(); this.options = options; windows.push(this);
      this.webContents = Object.assign(new EventEmitter(), {
        setWindowOpenHandler: (handler) => { this.openHandler = handler; },
        reload() {}, reloadIgnoringCache() {},
      });
    }
    loadURL(url) { urls.push(url); return Promise.resolve(); }
    loadFile(file, options) { files.push({file,options}); return Promise.resolve(); }
    show() {} focus() {} restore() {} setTitle() {}
    isDestroyed() { return false; } isMinimized() { return false; }
    static getAllWindows() { return windows; }
  }
  const electron = { app, BrowserWindow,
    screen: {getPrimaryDisplay: () => ({workAreaSize:{width:800,height:560}})},
    Menu: {buildFromTemplate: (template) => {menu=template; return template;}, setApplicationMenu() {}},
    shell: {openExternal: (url) => {external.push(url); return Promise.resolve();}, openPath: () => Promise.resolve("")},
    dialog: {showErrorBox() {}, showMessageBox: () => Promise.resolve()},
  };
  const dependencies = {electron, "node:path":path, "node:fs":{appendFileSync(){},mkdirSync(){},existsSync:()=>false}, "./runtime.cjs":require("../src/runtime.cjs")};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/main.cjs"),"utf8"), {
    require: (name) => dependencies[name], __dirname: path.join(__dirname,"../src"), URL,
    process: {platform:"win32", arch:"x64", env:{}},
  });
  await new Promise(resolve=>setImmediate(resolve));
  return {windows, urls, files, external, menu, quit};
}
test("startup uses isolated renderers and fits a small desktop", async () => {
  const result = await boot();
  assert.equal(result.windows.length,1);
  assert.equal(result.windows[0].options.width,800);
  assert.equal(result.windows[0].options.webPreferences.nodeIntegration,false);
  assert.equal(result.windows[0].options.webPreferences.sandbox,true);
});
test("a failed page loads the packaged recovery screen; Reload retries VIBE", async () => {
  const result = await boot();
  result.windows[0].webContents.emit("did-fail-load", {}, -105, "offline", "https://example.com", true);
  assert.equal(result.files.length,1);
  assert.equal(result.files[0].options.query.retry,result.urls[0]);
  assert.match(result.files[0].file,/connection-error\.html$/);
  result.menu.find(item=>item.label==="View").submenu[0].click();
  assert.equal(result.urls.length,2);
  assert.equal(result.urls[1],result.urls[0]);
});
test("aborted and subframe requests do not replace the page", async () => {
  const result=await boot();
  result.windows[0].webContents.emit("did-fail-load", {}, -3, "aborted", "", true);
  result.windows[0].webContents.emit("did-fail-load", {}, -105, "offline", "", false);
  assert.equal(result.files.length,0);
});
test("a second instance exits without creating a competing window", async () => {
  const result = await boot(false);
  assert.equal(result.quit,true);
  assert.equal(result.windows.length,0);
});
test("popup requests cannot launch arbitrary system protocols", async () => {
  const result = await boot();
  result.windows[0].openHandler({url:"file:///C:/test.exe"});
  assert.equal(result.external.length,0);
  result.windows[0].openHandler({url:"https://example.com"});
  assert.deepEqual(result.external,["https://example.com"]);
});
