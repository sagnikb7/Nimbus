// Provider registry. Add a vendor by dropping an adapter that exports
// fetchWeather(city, ctx) → neutral schema and a `meta` descriptor, then
// registering it here. Everything else (availability, key resolution, the
// /api/providers capability list) derives from the descriptors.
const weatherapi = require('./weatherapi');
const openMeteo = require('./open-meteo');

const adapters = {
  weatherapi,
  'open-meteo': openMeteo,
};

// Provider used when the client sends none. Keyless → always available.
const DEFAULT_PROVIDER = 'open-meteo';

// Resolve the adapter for a provider id, throwing a clear error otherwise.
function getAdapter(provider) {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(
      `Unknown weather provider "${provider}". Valid: ${Object.keys(adapters).join(', ')}`
    );
  }
  return adapter;
}

// The API key for a provider, resolved from env by descriptor (never stored in
// the descriptor). Returns undefined when unset. Honors a legacy fallback name.
function resolveKey(provider) {
  const { meta } = getAdapter(provider);
  if (!meta.keyEnvVar) return undefined;
  return (
    process.env[meta.keyEnvVar] ||
    (meta.keyEnvVarFallback && process.env[meta.keyEnvVarFallback]) ||
    undefined
  );
}

// A provider is available if it needs no key, or its key is configured.
function isAvailable(provider) {
  const { meta } = getAdapter(provider);
  return !meta.keyRequired || !!resolveKey(provider);
}

// Public capability list for GET /api/providers and startup logging.
// NEVER includes keys or env-var names — safe to send to the client.
function listProviders() {
  return Object.keys(adapters).map((id) => {
    const { meta } = adapters[id];
    return {
      id,
      label: meta.label,
      keyRequired: meta.keyRequired,
      available: isAvailable(id),
      forecastDays: meta.forecastDays,
      supportsAlerts: meta.supportsAlerts,
      supportsAirQuality: meta.supportsAirQuality,
      supportsCloudCover: meta.supportsCloudCover,
      supportsMoonPhase: meta.supportsMoonPhase,
    };
  });
}

module.exports = {
  adapters,
  DEFAULT_PROVIDER,
  getAdapter,
  resolveKey,
  isAvailable,
  listProviders,
};
