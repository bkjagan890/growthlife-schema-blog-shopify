export const API_VERSION = '2026-07';

/** Run a GraphQL Admin API query. Authenticated automatically by Shopify. */
export async function gql(query, variables) {
  const res = await fetch(`shopify:admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
  });
  if (!res.ok) throw new Error(`Admin API returned ${res.status}`);
  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join(' | '));
  }
  return json.data || {};
}

/** Throw if a mutation payload carries user errors. */
export function assertNoUserErrors(payload, label = 'Request') {
  if (!payload) throw new Error(`${label} returned no result`);
  const errs = [...(payload.userErrors || []), ...(payload.mediaUserErrors || [])];
  if (errs.length) throw new Error(`${label}: ${errs.map((e) => e.message).join(' | ')}`);
  return payload;
}

/**
 * Walk every page of a GraphQL connection.
 * `fetchPage(cursor)` must resolve to `{nodes, pageInfo}`.
 */
export async function collect(fetchPage, {max = Infinity, onProgress} = {}) {
  const out = [];
  let cursor = null;
  let hasNext = true;
  let guard = 0;
  while (hasNext && out.length < max && guard++ < 400) {
    const conn = await fetchPage(cursor);
    if (!conn) break;
    for (const node of conn.nodes || []) out.push(node);
    hasNext = Boolean(conn.pageInfo && conn.pageInfo.hasNextPage);
    cursor = conn.pageInfo && conn.pageInfo.endCursor;
    if (onProgress) onProgress(out.length);
  }
  return out;
}

/** Run async work over a list with limited concurrency, reporting progress. */
export async function runQueue(items, worker, {concurrency = 3, onProgress} = {}) {
  const results = new Array(items.length);
  let index = 0;
  let done = 0;
  async function pump() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = {ok: true, value: await worker(items[i], i)};
      } catch (error) {
        results[i] = {ok: false, error: error && error.message ? error.message : String(error)};
      }
      done++;
      if (onProgress) onProgress(done, items.length, results[i]);
    }
  }
  const lanes = Math.min(concurrency, items.length) || 0;
  await Promise.all(Array.from({length: lanes}, pump));
  return results;
}
