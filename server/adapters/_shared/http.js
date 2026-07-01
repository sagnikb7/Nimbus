// Thin fetch wrapper shared by every adapter. Uses Node's global fetch
// (Node 18+), so the same module works in Express and in Netlify functions
// with no build step or extra dependency.
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    // Surface the vendor's error body when it's JSON with a message.
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.reason || '';
    } catch {
      /* non-JSON error body — ignore */
    }
    const err = new Error(detail || `Upstream request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

module.exports = { getJson };
