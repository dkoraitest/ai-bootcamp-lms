import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { loadSource } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const source = readFileSync('src/middleware.ts', 'utf8');
const protectedPath = '/artifacts/flow-2/week-5/guide.html';

async function runMiddleware(path, {
  user = { id: 'test-user', app_metadata: { role: 'student' } },
  cohorts = [{ id: 'flow-1' }], rpcError = null, rpcThrows = false,
  authError = null, authThrows = false, configured = true,
} = {}) {
  const calls = [];
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (configured) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.invalid';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-key';
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  // Replace only the external service boundary; execute the actual middleware
  // and Next request/response implementations without network or real sessions.
  globalThis.__artifactTestCreateClient = () => ({
    auth: { async getUser() {
      if (authThrows) throw new Error('test auth unavailable');
      return { data: { user }, error: authError };
    } },
    async rpc(name, ...args) {
      calls.push([name, ...args]);
      if (rpcThrows) throw new Error('test RPC unavailable');
      return { data: cohorts, error: rpcError };
    },
  });
  try {
    const { middleware } = loadSource(source.replace(
      'import { createServerClient } from "@supabase/ssr";',
      'const createServerClient = globalThis.__artifactTestCreateClient;'
    ), 'src/middleware.ts');
    const response = await middleware(new NextRequest(`https://lms.test${path}`));
    return { response, calls };
  } finally {
    delete globalThis.__artifactTestCreateClient;
    for (const [key, value] of [
      ['NEXT_PUBLIC_SUPABASE_URL', savedUrl],
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', savedKey],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('flow-1-only student cannot fetch flow-2 artifacts directly', async () => {
  const { response, calls } = await runMiddleware(protectedPath);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(calls, [['get_available_cohorts']]);
});

test('access follows RPC membership for students, admins and experts', async () => {
  for (const role of ['student', 'admin', 'expert']) {
    const user = { id: 'test-user', app_metadata: { role } };
    const allowed = await runMiddleware(protectedPath, { user, cohorts: [{ id: 'flow-2' }] });
    assert.equal(allowed.response.status, 200, role);
    assert.equal(allowed.response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(allowed.calls, [['get_available_cohorts']]);
    const denied = await runMiddleware(protectedPath, { user });
    assert.equal(denied.response.status, 403, role);
  }
});

test('RPC failures and malformed results fail closed with no-store', async () => {
  for (const options of [
    { rpcError: { message: 'test error' }, cohorts: [{ id: 'flow-2' }] },
    { rpcThrows: true }, { cohorts: null }, { cohorts: {} },
    { cohorts: [null, { id: 'flow-20' }, { cohort_id: 'flow-2' }] },
  ]) {
    const { response } = await runMiddleware(protectedPath, options);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});

test('missing configuration and failed authentication cannot expose protected artifacts', async () => {
  for (const options of [
    { configured: false }, { authThrows: true },
    { authError: { message: 'test auth error' }, cohorts: [{ id: 'flow-2' }] },
  ]) {
    const { response, calls } = await runMiddleware(protectedPath, options);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(calls, []);
  }
  const { response, calls } = await runMiddleware(protectedPath, { user: null });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get('location')).pathname, '/login');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(calls, []);
});

test('encoded prefixes, separators and dot segments cannot bypass cohort checks', async () => {
  for (const path of [
    '/artifacts/flow-2', '/artifacts/flow-2/',
    '/%61rtifacts/flow-2/week-5/guide.html',
    '/artifacts/%66low%2D2/week-5/guide.html',
    '/artifacts%2fflow-2%2fweek-5%2fguide.html',
    '/artifacts%252Fflow-2/week-5/guide.html',
    '/artifacts/legacy%2f..%2fflow-2/week-5/guide.html',
    '/%61rtifacts/flow-2/week-5/bad-%FF.html',
    '/artifacts%5cflow-2%5cweek-5%5cguide.html',
  ]) {
    const { response } = await runMiddleware(path);
    assert.equal(response.status, 403, path);
  }
});

test('legacy artifacts and dashboard retain existing login and preview behavior', async () => {
  for (const path of ['/artifacts/legacy.html', '/artifacts/flow-20/guide.html', '/', '/program']) {
    const allowed = await runMiddleware(path);
    assert.equal(allowed.response.status, 200, path);
    assert.deepEqual(allowed.calls, []);
    const preview = await runMiddleware(path, { configured: false });
    assert.equal(preview.response.status, 200, path);
    const anonymous = await runMiddleware(path, { user: null });
    assert.equal(anonymous.response.status, 307, path);
    assert.equal(new URL(anonymous.response.headers.get('location')).pathname, '/login');
  }
  for (const path of ['/login', '/register']) {
    const anonymous = await runMiddleware(path, { user: null });
    assert.equal(anonymous.response.status, 200);
    const signedIn = await runMiddleware(path);
    assert.equal(signedIn.response.status, 307);
    assert.equal(new URL(signedIn.response.headers.get('location')).pathname, '/');
  }
  const student = await runMiddleware('/admin/projects');
  assert.equal(student.response.status, 307);
  for (const role of ['admin', 'expert']) {
    const privileged = await runMiddleware('/admin/projects', { user: { app_metadata: { role } } });
    assert.equal(privileged.response.status, 200);
    assert.deepEqual(privileged.calls, []);
  }
});
