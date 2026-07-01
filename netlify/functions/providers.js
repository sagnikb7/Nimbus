// Netlify equivalent of GET /api/providers — the client's capability list.
// Returns only { id, label, keyRequired, available }; never keys.
const { listProviders } = require('../../server/adapters');

exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify(listProviders()),
});
