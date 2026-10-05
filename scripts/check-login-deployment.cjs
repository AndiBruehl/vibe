// Read-only checks: no credentials, OAuth grants or account writes.
const origin = new URL(process.argv[2] || 'http://localhost:3000').origin;
async function run() {
  const response = await fetch(`${origin}/api/auth/providers`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`Provider endpoint: HTTP ${response.status}`);
  const providers = await response.json();
  for (const id of ['google', 'discord']) {
    const item = providers[id];
    if (!item || item.callbackUrl !== `${origin}/api/auth/callback/${id}`) throw Error(`${id}: missing provider or wrong callback origin`);
    console.log(`${id}: configured callback matches deployment`);
  }
  const session = await fetch(`${origin}/api/auth/session`, { signal: AbortSignal.timeout(15000) });
  if (!session.ok || (await session.json())?.user) throw Error('Unexpected anonymous session response');
  console.log('Anonymous session: OK');
  console.log('OAuth approval, database mutations and native sign-in remain separate end-to-end checks.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
