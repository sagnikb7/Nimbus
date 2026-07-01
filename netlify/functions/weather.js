// Netlify serverless equivalent of the Express /api/weather route. Shares the
// exact same adapter registry (server/adapters) so vendor logic is never
// duplicated. Provider is chosen by the client via ?provider= (default
// open-meteo); each provider resolves its own key from env via its descriptor.
const { getAdapter, resolveKey, isAvailable, DEFAULT_PROVIDER } = require('../../server/adapters');

const json = (statusCode, body) => ({ statusCode, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const city = event.queryStringParameters?.city;
  const provider = event.queryStringParameters?.provider || DEFAULT_PROVIDER;

  if (!city) return json(400, { error: 'City query parameter is required' });

  let adapter;
  try {
    adapter = getAdapter(provider);
  } catch {
    return json(400, { error: `Unknown weather provider: ${provider}` });
  }
  if (!isAvailable(provider)) {
    return json(400, { error: `Weather provider "${provider}" is not configured (missing API key)` });
  }

  try {
    const data = await adapter.fetchWeather(city, { apiKey: resolveKey(provider) });
    data.provider = provider; // stamp source so the client never mixes providers
    return json(200, data);
  } catch (err) {
    return json(err.status || 500, { error: err.message || 'Failed to fetch weather data' });
  }
};
