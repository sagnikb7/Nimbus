import { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import AlertsBanner from './components/AlertsBanner';
import SunriseSunset from './components/SunriseSunset';
import WeatherDetails from './components/WeatherDetails';
import AQIDetail from './components/AQIDetail';
import Forecast from './components/Forecast';
import HourlyForecast from './components/HourlyForecast';
import WeatherParticles from './components/WeatherParticles';
import ShareCard from './components/ShareCard';
import WindDetail from './components/WindDetail';
import SettingsPanel from './components/SettingsPanel';
import { getWeatherMood } from './utils/weatherMood';
import { captureShareCard, shareOrDownload } from './utils/shareUtils';
import { getCached, getCachedByQuery, setCache, removeCache, partitionCities, getLocationKey } from './utils/weatherCache';
import './App.css';

function FreshnessLabel({ cacheKey, providerId, providerLabel }) {
  const [, tick] = useState(0);

  // Re-render every 60s to keep the relative time current
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!cacheKey) return null;
  const hit = getCached(cacheKey, providerId);
  if (!hit) return null;

  const secs = Math.floor((Date.now() - hit.ts) / 1000);
  let text;
  if (secs < 60) text = 'just now';
  else {
    const mins = Math.floor(secs / 60);
    if (mins < 60) text = `${mins} min${mins > 1 ? 's' : ''} ago`;
    else {
      const hours = Math.floor(mins / 60);
      text = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  }

  return (
    <span className="freshness-label">
      Updated {text}{providerLabel ? ` · ${providerLabel}` : ''}
    </span>
  );
}

export default function App() {
  // Saved cities are objects keyed by stable location identity:
  //   { key, name, region, country, lat, lon, query, pinned }
  // Auto-added on search; FIFO-evicted from oldest unpinned at cap 5.
  // Pinned cities never evict. Legacy entries migrate as pinned (they were
  // explicitly saved under the old bookmark model).
  const [savedCities, setSavedCities] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('savedCities') || '[]');
      return raw.map((c) => {
        if (typeof c === 'string') return { key: null, name: c, query: c, pinned: true };
        return c.pinned === undefined ? { ...c, pinned: true } : c;
      });
    } catch {
      return [];
    }
  });
  const [savedWeather, setSavedWeather] = useState({});
  const [activeWeather, setActiveWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [windDetailOpen, setWindDetailOpen] = useState(false);
  const [aqiDetailOpen, setAQIDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const shareCardRef = useRef(null);

  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('tempUnit') || 'c';
  });

  // Weather data provider — a client setting (default open-meteo), sent to the
  // backend per request. A settings selector to change it lands later; for now
  // it's driven by localStorage and self-heals against /api/providers below.
  const [weatherProvider, setWeatherProvider] = useState(() => {
    return localStorage.getItem('weatherProvider') || 'open-meteo';
  });
  const [providers, setProviders] = useState([]);
  const [providerSwitching, setProviderSwitching] = useState(false);

  // Theme preference (light | dark | system) vs the resolved value applied to
  // <html data-theme>. "system" follows the OS and updates live.
  const [themePref, setThemePref] = useState(() => localStorage.getItem('theme') || 'system');
  const [systemTheme, setSystemTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = themePref === 'system' ? systemTheme : themePref;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('theme', themePref);
  }, [resolvedTheme, themePref]);

  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('weatherProvider', weatherProvider);
  }, [weatherProvider]);

  // Provider capability list (for the Settings selector) + self-heal: if the
  // stored provider isn't available (e.g. its key was removed), fall back to the
  // keyless default so requests don't 400.
  useEffect(() => {
    fetch('/api/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!list) return;
        setProviders(list);
        const ok = list.some((p) => p.id === weatherProvider && p.available);
        if (!ok) setWeatherProvider('open-meteo');
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a /api/weather URL carrying the active provider.
  const weatherUrl = (query) =>
    `/api/weather?city=${encodeURIComponent(query)}&provider=${encodeURIComponent(weatherProvider)}`;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
  }, [savedCities]);

  // Load weather for saved cities — serve cached data instantly, fetch stale/missing in background
  useEffect(() => {
    if (savedCities.length === 0) return;

    const { cached, toFetch } = partitionCities(savedCities, weatherProvider);

    // Show all cached data immediately (fresh stays as-is, stale gets SWR below)
    if (Object.keys(cached).length > 0) {
      setSavedWeather(cached);
      const first = savedCities[0];
      if (first.key && cached[first.key]) setActiveWeather(cached[first.key]);
    }

    // Everything is fresh — no API calls needed
    if (toFetch.length === 0) return;

    // Background-fetch stale + missing cities (and unresolved legacy entries)
    Promise.all(
      toFetch.map((c) =>
        fetch(weatherUrl(c.query))
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const newWeather = {};
      const resolved = new Map(); // original saved-city object → resolved object

      results.forEach((data, i) => {
        if (!data) return;
        const c = toFetch[i];
        const key = setCache(data, c.query);
        newWeather[key] = data;

        // Legacy entry (or one whose key drifted): record its resolved identity
        if (c.key !== key) {
          resolved.set(c, {
            key,
            name: data.location.name,
            region: data.location.region,
            country: data.location.country,
            lat: data.location.lat,
            lon: data.location.lon,
            query: `${data.location.lat},${data.location.lon}`,
          });
        }
      });

      if (Object.keys(newWeather).length === 0) return;

      // Replace any newly-resolved legacy entries (matched by object identity)
      if (resolved.size > 0) {
        setSavedCities((prev) => prev.map((c) => resolved.get(c) || c));
      }

      setSavedWeather((prev) => ({ ...prev, ...newWeather }));

      // SWR: silently refresh active weather if it was stale
      setActiveWeather((prev) => {
        if (!prev) {
          const first = savedCities[0];
          const firstKey = first.key || resolved.get(first)?.key;
          return (firstKey && newWeather[firstKey]) || null;
        }
        const k = getLocationKey(prev.location);
        return newWeather[k] || prev;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(query) {
    setError('');

    // upsertCity: always update weather cache; auto-add to dock if not present
    // (FIFO-evicts oldest unpinned when at cap 5; silently skips if all pinned).
    const upsertCity = (key, data) => {
      setSavedWeather((prev) => ({ ...prev, [key]: data }));
      setSavedCities((prev) => {
        if (prev.some((c) => c.key === key)) return prev;
        const loc = data.location;
        const entry = {
          key,
          name: loc.name,
          region: loc.region,
          country: loc.country,
          lat: loc.lat,
          lon: loc.lon,
          query: `${loc.lat},${loc.lon}`,
          pinned: false,
        };
        if (prev.length < 5) return [...prev, entry];
        const evictIdx = prev.findIndex((c) => !c.pinned);
        if (evictIdx === -1) return prev; // all pinned — silently skip
        removeCache(prev[evictIdx].key);
        return [...prev.slice(0, evictIdx), ...prev.slice(evictIdx + 1), entry];
      });
    };

    const hit = getCachedByQuery(query, weatherProvider);

    // --- Cache-hit path: fresh data → no API call ---
    if (hit?.fresh) {
      setActiveWeather(hit.data);
      upsertCity(getLocationKey(hit.data.location), hit.data);
      return;
    }

    // --- SWR path: stale data → show immediately, refresh in background ---
    if (hit) {
      setActiveWeather(hit.data);
      upsertCity(getLocationKey(hit.data.location), hit.data);
      // Silent background refresh (no loading spinner)
      fetch(weatherUrl(query))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const key = setCache(data, query);
          setActiveWeather((prev) =>
            prev && getLocationKey(prev.location) === key ? data : prev
          );
          upsertCity(key, data);
        })
        .catch(() => {});
      return;
    }

    // --- Miss path: no cache → fetch with loading spinner ---
    setLoading(true);
    try {
      const res = await fetch(weatherUrl(query));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'City not found');

      setActiveWeather(data);
      upsertCity(setCache(data, query), data);
    } catch (err) {
      setError(err.message);
      setActiveWeather(null);
    } finally {
      setLoading(false);
    }
  }

  // Autocomplete selection — resolve by coordinates so same-named cities
  // (e.g. multiple "Gopalpur"s) fetch the exact place the user picked.
  function handleSelectPlace(place) {
    handleSearch(`${place.lat},${place.lon}`);
  }

  function handleTogglePin(key) {
    setSavedCities((prev) =>
      prev.map((c) => (c.key === key ? { ...c, pinned: !c.pinned } : c))
    );
  }

  function handleRemove(key) {
    setSavedCities((prev) => prev.filter((c) => c.key !== key));
    setSavedWeather((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    removeCache(key);
    if (activeWeather && getLocationKey(activeWeather.location) === key) {
      setActiveWeather(null);
    }
  }

  function handleSelectCity(key) {
    const data = savedWeather[key];
    if (data) {
      setActiveWeather(data);
      setError('');
    }
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await handleSearch(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        const messages = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        setError(messages[err.code] || 'Unable to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function handleRefresh() {
    if (!activeWeather || refreshing) return;
    setRefreshing(true);
    const loc = activeWeather.location;
    const query = `${loc.lat},${loc.lon}`;
    try {
      const res = await fetch(weatherUrl(query));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveWeather(data);
      const key = setCache(data, query);
      setSavedWeather((prev) => (key in prev ? { ...prev, [key]: data } : prev));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Switch the data provider and re-pull every saved city from the new source in
  // the background. A location's identity (name|region|country) can differ
  // between providers, so we MIGRATE each saved city's key to the new provider's
  // key — otherwise savedWeather/activeWeather would look up under a stale key
  // and keep showing the old provider's data (e.g. 3-day vs 7-day forecast).
  async function handleProviderChange(next) {
    if (next === weatherProvider || providerSwitching) return;
    setWeatherProvider(next);
    const cities = savedCities;
    if (cities.length === 0) return;

    const prevActiveKey = activeWeather ? getLocationKey(activeWeather.location) : null;
    setProviderSwitching(true);
    try {
      const results = await Promise.all(
        cities.map((c) =>
          fetch(`/api/weather?city=${encodeURIComponent(c.query)}&provider=${next}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );

      const newWeather = {};
      const remap = new Map(); // oldKey → { newKey, data }
      results.forEach((data, i) => {
        if (!data) return;
        const c = cities[i];
        const newKey = setCache(data, c.query); // getLocationKey(data.location)
        newWeather[newKey] = data;
        remap.set(c.key, { newKey, data });
        if (c.key && c.key !== newKey) removeCache(c.key); // prune stale entry
      });
      if (remap.size === 0) return;

      // Re-point saved cities at their new-provider keys
      setSavedCities((prev) =>
        prev.map((c) => {
          const r = remap.get(c.key);
          return r && r.newKey !== c.key ? { ...c, key: r.newKey } : c;
        })
      );
      // Replace (not merge) so no city keeps the previous provider's data — any
      // that failed to refetch drop to "…" and get re-pulled later.
      setSavedWeather(newWeather);

      const activeRemap = prevActiveKey && remap.get(prevActiveKey);
      setActiveWeather(activeRemap ? activeRemap.data : null);
    } finally {
      setProviderSwitching(false);
    }
  }

  async function handleShare() {
    if (!activeWeather || sharing) return;
    setSharing(true);
    try {
      const el = shareCardRef.current;
      if (!el) throw new Error('Share card not ready');
      const canvas = await captureShareCard(el);
      await shareOrDownload(canvas, activeWeather.location.name);
    } catch {
      setError('Failed to share weather card');
    } finally {
      setSharing(false);
    }
  }

  // Weather-reactive ambient background
  const mood = useMemo(() => {
    if (!activeWeather) return null;
    return getWeatherMood(
      activeWeather.current.condition.id,
      activeWeather.current.is_day
    );
  }, [activeWeather]);

  useEffect(() => {
    if (mood) {
      document.documentElement.setAttribute('data-mood', mood);
    } else {
      document.documentElement.removeAttribute('data-mood');
    }
  }, [mood]);

  const activeCity = activeWeather?.location?.name;
  const activeKey = activeWeather ? getLocationKey(activeWeather.location) : null;
  const providerLabel = providers.find((p) => p.id === weatherProvider)?.label || weatherProvider;
  // Label the freshness line by the DATA's actual source (stamped server-side),
  // not the selected setting — so it never mislabels during a switch.
  const activeProviderLabel =
    providers.find((p) => p.id === activeWeather?.provider)?.label || activeWeather?.provider || providerLabel;
  const astro = activeWeather?.daily?.[0]?.astro;

  // Close detail overlays when the active place changes
  useEffect(() => {
    setWindDetailOpen(false);
    setAQIDetailOpen(false);
  }, [activeKey]);

  return (
    <div className="shell">
      <WeatherParticles mood={mood} />

      <header className="header">
        <div className="header-brand">
          <svg className="header-logo" viewBox="2 4 20 15" fill="currentColor">
            <circle cx="10.2" cy="9.8" r="4.8" />
            <circle cx="15.2" cy="10.8" r="3.6" />
            <circle cx="6.6" cy="12.8" r="3.6" />
            <circle cx="18.2" cy="13.6" r="3.1" />
            <rect x="6.2" y="11.2" width="12.4" height="5.6" rx="2.8" />
          </svg>
          <span className="header-name">Nimbus</span>
        </div>

        <SearchBar
          onSearch={handleSearch}
          onSelectPlace={handleSelectPlace}
          loading={loading}
          onUseLocation={handleGeolocation}
          geoLoading={geoLoading}
        />

        <div className="header-actions">
          {activeWeather && (
            <>
              <button
                className={`refresh-btn${refreshing ? ' spinning' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh weather"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
              <button
                className="share-btn"
                onClick={handleShare}
                disabled={sharing}
                title="Share weather"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </>
          )}
          <button
            className="settings-btn"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="main">
        {error && <div className="error-message">{error}</div>}

        {activeWeather ? (
          <div className="weather-content" key={activeKey}>
            <AlertsBanner alerts={activeWeather.alerts} />
            <CurrentWeather
              data={activeWeather}
              tempUnit={tempUnit}
              freshness={
                <FreshnessLabel
                  cacheKey={activeKey}
                  providerId={activeWeather.provider}
                  providerLabel={activeProviderLabel}
                />
              }
            />
            {astro && (
              <SunriseSunset
                astro={astro}
                nextAstro={activeWeather.daily?.[1]?.astro}
                localtime={activeWeather.location.localtime}
                isDay={activeWeather.current.is_day}
              />
            )}
            <WeatherDetails
              current={activeWeather.current}
              onWindClick={() => setWindDetailOpen(true)}
              onAQIClick={() => setAQIDetailOpen(true)}
            />
            {activeWeather.daily?.length > 0 && (
              <HourlyForecast
                forecastDays={activeWeather.daily}
                localtime={activeWeather.location.localtime}
                tempUnit={tempUnit}
              />
            )}
            {activeWeather.daily?.length > 0 && (
              <Forecast
                days={activeWeather.daily}
                tempUnit={tempUnit}
              />
            )}
          </div>
        ) : (
          !error && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="2 4 20 15" fill="currentColor">
                  <circle cx="10.2" cy="9.8" r="4.8" />
                  <circle cx="15.2" cy="10.8" r="3.6" />
                  <circle cx="6.6" cy="12.8" r="3.6" />
                  <circle cx="18.2" cy="13.6" r="3.1" />
                  <rect x="6.2" y="11.2" width="12.4" height="5.6" rx="2.8" />
                </svg>
              </div>
              <p className="empty-title">Check the weather</p>
              <p className="empty-subtitle">Search for any city to get started</p>
            </div>
          )
        )}
      </main>

      {savedCities.length > 0 && (
        <Sidebar
          cities={savedCities}
          weatherData={savedWeather}
          activeKey={activeKey}
          onSelect={handleSelectCity}
          onRemove={handleRemove}
          onTogglePin={handleTogglePin}
          tempUnit={tempUnit}
        />
      )}

      {activeWeather && (
        <ShareCard ref={shareCardRef} data={activeWeather} tempUnit={tempUnit} mood={mood} />
      )}

      {windDetailOpen && activeWeather && (
        <WindDetail
          current={activeWeather.current}
          forecastDays={activeWeather.daily || []}
          localtime={activeWeather.location.localtime}
          onClose={() => setWindDetailOpen(false)}
        />
      )}

      {aqiDetailOpen && activeWeather?.current?.air_quality && (
        <AQIDetail
          airQuality={activeWeather.current.air_quality}
          onClose={() => setAQIDetailOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          themePref={themePref}
          onThemeChange={setThemePref}
          tempUnit={tempUnit}
          onUnitChange={setTempUnit}
          providers={providers}
          weatherProvider={weatherProvider}
          onProviderChange={handleProviderChange}
          providerSwitching={providerSwitching}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
