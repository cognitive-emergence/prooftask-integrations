#!/usr/bin/env node
// Local-only helper. Does not upload the original or fetch its reference.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
const [path, reference] = process.argv.slice(2);
if (!path || !reference) throw new Error('Usage: node agent/fingerprint-file.mjs /path/to/original https://your-original-reference');
const url = new URL(reference);
if (url.protocol !== 'https:' || url.username || url.password || url.hash || [...url.searchParams.keys()].some(k => /token|secret|password|credential|signature|authorization|api.?key|^sig$|^key$/i.test(k))) throw new Error('Use a credential-free original HTTPS reference, without a signed access token.');
const original = readFileSync(path);
if (original.length > 2 * 1024 * 1024 * 1024) throw new Error('An original must be at most 2 GiB.');
console.log(JSON.stringify({ reference, name: basename(path), size: original.length, sha256: createHash('sha256').update(original).digest('hex') }, null, 2));
