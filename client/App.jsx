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
import { getWeatherMood } from './utils/weatherMood';
import { captureShareCard, shareOrDownload } from './utils/shareUtils';
import { getCached, getCachedByQuery, setCache, removeCache, partitionCities, getLocationKey } from './utils/weatherCache';
import './App.css';

function FreshnessLabel({ cacheKey }) {
  const [, tick] = useState(0);

  // Re-render every 60s to keep the relative time current
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!cacheKey) return null;
  const hit = getCached(cacheKey);
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

  return <span className="freshness-label">Updated {text}</span>;
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
  const shareCardRef = useRef(null);

  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('tempUnit') || 'c';
  });

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  function toggleTempUnit() {
    setTempUnit((prev) => (prev === 'c' ? 'f' : 'c'));
  }

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
  }, [savedCities]);

  // Load weather for saved cities — serve cached data instantly, fetch stale/missing in background
  useEffect(() => {
    if (savedCities.length === 0) return;

    const { cached, toFetch } = partitionCities(savedCities);

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
        fetch(`/api/weather?city=${encodeURIComponent(c.query)}`)
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

    const hit = getCachedByQuery(query);

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
      fetch(`/api/weather?city=${encodeURIComponent(query)}`)
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
      const res = await fetch(`/api/weather?city=${encodeURIComponent(query)}`);
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
      const res = await fetch(`/api/weather?city=${encodeURIComponent(query)}`);
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
      activeWeather.current.condition.code,
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
  const astro = activeWeather?.forecast?.forecastday?.[0]?.astro;

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
          <svg className="header-logo" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" stroke="currentColor" strokeWidth="1.7" fill="currentColor" opacity="0.15"/>
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" stroke="currentColor" strokeWidth="1.7" fill="none"/>
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
            className="unit-toggle"
            onClick={toggleTempUnit}
            title={`Switch to °${tempUnit === 'c' ? 'F' : 'C'}`}
          >
            °{tempUnit.toUpperCase()}
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="main">
        {error && <div className="error-message">{error}</div>}

        {activeWeather ? (
          <div className="weather-content" key={activeKey}>
            <AlertsBanner alerts={activeWeather.alerts} />
            <CurrentWeather data={activeWeather} tempUnit={tempUnit} />
            {astro && (
              <SunriseSunset
                astro={astro}
                nextAstro={activeWeather.forecast?.forecastday?.[1]?.astro}
                localtime={activeWeather.location.localtime}
                isDay={activeWeather.current.is_day}
              />
            )}
            <FreshnessLabel cacheKey={activeKey} />
            <WeatherDetails
              current={activeWeather.current}
              onWindClick={() => setWindDetailOpen(true)}
              onAQIClick={() => setAQIDetailOpen(true)}
            />
            {activeWeather.forecast && (
              <HourlyForecast
                forecastDays={activeWeather.forecast.forecastday}
                localtime={activeWeather.location.localtime}
                tempUnit={tempUnit}
              />
            )}
            {activeWeather.forecast && (
              <Forecast
                days={activeWeather.forecast.forecastday}
                tempUnit={tempUnit}
              />
            )}
          </div>
        ) : (
          !error && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.08"/>
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
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
          forecastDays={activeWeather.forecast?.forecastday || []}
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
    </div>
  );
}
