import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
export function loadSource(source, filename) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  const mod = { exports: {} };
  function localRequire(name) {
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const base = name.startsWith('@/') ? resolve('src', name.slice(2)) : resolve(dirname(filename), name);
    const file = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
    if (!file) throw new Error(`Missing module: ${name}`);
    return loadTypeScriptModule(file);
  }
  vm.runInThisContext(`(function(exports, require, module) {${outputText}\n})`, { filename })(mod.exports, localRequire, mod);
  return mod.exports;
}
export function loadTypeScriptModule(path) {
  const filename = resolve(path);
  if (!cache.has(filename)) cache.set(filename, loadSource(readFileSync(filename, 'utf8'), filename));
  return cache.get(filename);
}
