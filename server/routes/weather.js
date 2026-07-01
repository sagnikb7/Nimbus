const express = require('express');
const { getAdapter, resolveKey, isAvailable, listProviders, DEFAULT_PROVIDER } = require('../adapters');

const router = express.Router();

router.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  const provider = req.query.provider || DEFAULT_PROVIDER;

  if (!city) {
    return res.status(400).json({ error: 'City query parameter is required' });
  }

  // Provider is client input — validate against the registry before trusting it.
  let adapter;
  try {
    adapter = getAdapter(provider);
  } catch {
    return res.status(400).json({ error: `Unknown weather provider: ${provider}` });
  }
  if (!isAvailable(provider)) {
    return res.status(400).json({ error: `Weather provider "${provider}" is not configured (missing API key)` });
  }

  try {
    const data = await adapter.fetchWeather(city, { apiKey: resolveKey(provider) });
    data.provider = provider; // stamp source so the client never mixes providers
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch weather data' });
  }
});

// Capability list for the client (which providers exist + are usable). No keys.
router.get('/api/providers', (req, res) => {
  res.json(listProviders());
});

// City autocomplete is browser-direct to Open-Meteo geocoding (keyless + CORS
// open — no proxy). See client/components/SearchBar.jsx.

module.exports = router;
