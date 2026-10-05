import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

async function getAvailablePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForServer(url, child, getOutput) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before the smoke test started.\n${getOutput()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for Next.js.\n${getOutput()}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;

  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);

  if (child.exitCode === null) child.kill('SIGKILL');
}

const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const nextBinary = 'node_modules/next/dist/bin/next';
const child = spawn(process.execPath, [nextBinary, 'dev', '-H', '127.0.0.1', '-p', String(port)], {
  env: {
    ...process.env,
    NEXT_PUBLIC_APP_URL: baseUrl,
    NEXT_PUBLIC_SUPABASE_URL: 'https://daily-shine-smoke.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'smoke-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'smoke-service-role-key',
    STRIPE_SECRET_KEY: 'sk_test_daily_shine_smoke',
    STRIPE_PRICE_ID: 'price_daily_shine_smoke',
    STRIPE_WEBHOOK_SECRET: 'whsec_daily_shine_smoke',
    ANTHROPIC_API_KEY: 'smoke-anthropic-key',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
const collectOutput = chunk => {
  output = `${output}${chunk}`.slice(-12_000);
};
child.stdout.on('data', collectOutput);
child.stderr.on('data', collectOutput);

const checks = [
  { path: '/api/stripe/checkout', status: 401, error: 'Unauthorized' },
  { path: '/api/stripe/portal', status: 401, error: 'Unauthorized' },
  { path: '/api/stripe/verify', status: 401, error: 'Unauthorized' },
  { path: '/api/stripe/webhook', status: 400, error: 'Invalid signature' },
];

try {
  await waitForServer(baseUrl, child, () => output);

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`, { method: 'POST' });
    const body = await response.json();

    assert.equal(response.status, check.status, `${check.path} returned ${response.status}`);
    assert.equal(body.error, check.error, `${check.path} returned an unexpected body`);
    console.log(`✓ ${check.path} rejects an unauthenticated request`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await stopServer(child);
}
