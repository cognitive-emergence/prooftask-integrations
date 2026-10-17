#!/usr/bin/env node
// Public, read-only template discovery. Node.js 24+, no dependencies.
export async function discover(query = 'automation', fetcher = fetch) {
  if (typeof query !== 'string' || query.length > 200) throw new Error('Use a search phrase of at most 200 characters.');
  const url = new URL('https://prooftask.com/api/public/specifications');
  url.searchParams.set('q', query);
  const response = await fetcher(url, { headers: { accept: 'application/json', 'user-agent': 'Prooftask-Integration-Example/0.1' }, redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Public discovery returned HTTP ${response.status}`);
  return response.json();
}
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(JSON.stringify(await discover(process.argv.slice(2).join(' ') || 'automation'), null, 2) + '\n'); }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
