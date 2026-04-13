import { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import WeatherDetails from './components/WeatherDetails';
import AQIDetail from './components/AQIDetail';
import Forecast from './components/Forecast';
import HourlyForecast from './components/HourlyForecast';
import WeatherParticles from './components/WeatherParticles';
import ShareCard from './components/ShareCard';
import WindDetail from './components/WindDetail';
import { getWeatherMood } from './utils/weatherMood';
import { captureShareCard, shareOrDownload } from './utils/shareUtils';
import { getCached, setCache, removeCache, partitionCities } from './utils/weatherCache';
import './App.css';

function FreshnessLabel({ city }) {
  const [, tick] = useState(0);

  // Re-render every 60s to keep the relative time current
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!city) return null;
  const hit = getCached(city);
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
  const [savedCities, setSavedCities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedCities') || '[]');
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
      if (cached[first]) setActiveWeather(cached[first]);
    }

    // Everything is fresh — no API calls needed
    if (toFetch.length === 0) return;

    // Background-fetch stale + missing cities
    Promise.all(
      toFetch.map((city) =>
        fetch(`/api/weather?city=${encodeURIComponent(city)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const newData = {};
      toFetch.forEach((city, i) => {
        if (results[i]) {
          newData[city] = results[i];
          setCache(city, results[i]);
        }
      });

      if (Object.keys(newData).length === 0) return;

      setSavedWeather((prev) => ({ ...prev, ...newData }));

      // SWR: silently refresh active weather if it was stale
      setActiveWeather((prev) => {
        if (!prev) {
          const first = savedCities[0];
          return newData[first] || null;
        }
        const name = prev.location?.name;
        return newData[name] || prev;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(city) {
    setError('');

    // --- Cache-hit path: fresh data → no API call ---
    const hit = getCached(city);
    if (hit?.fresh) {
      setActiveWeather(hit.data);
      const name = hit.data.location.name;
      if (savedCities.includes(name)) {
        setSavedWeather((prev) => ({ ...prev, [name]: hit.data }));
      }
      return;
    }

    // --- SWR path: stale data → show immediately, refresh in background ---
    if (hit) {
      setActiveWeather(hit.data);
      const cachedName = hit.data.location.name;
      if (savedCities.includes(cachedName)) {
        setSavedWeather((prev) => ({ ...prev, [cachedName]: hit.data }));
      }
      // Silent background refresh (no loading spinner)
      fetch(`/api/weather?city=${encodeURIComponent(city)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const name = data.location.name;
          setCache(name, data);
          // Only update display if user is still viewing this city
          setActiveWeather((prev) =>
            prev?.location?.name === name ? data : prev
          );
          if (savedCities.includes(name)) {
            setSavedWeather((prev) => ({ ...prev, [name]: data }));
          }
        })
        .catch(() => {});
      return;
    }

    // --- Miss path: no cache → fetch with loading spinner ---
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'City not found');

      setActiveWeather(data);
      const name = data.location.name;
      setCache(name, data);
      if (savedCities.includes(name)) {
        setSavedWeather((prev) => ({ ...prev, [name]: data }));
      }
    } catch (err) {
      setError(err.message);
      setActiveWeather(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!activeWeather) return;
    const name = activeWeather.location.name;
    if (savedCities.includes(name) || savedCities.length >= 5) return;

    setSavedCities((prev) => [...prev, name]);
    setSavedWeather((prev) => ({ ...prev, [name]: activeWeather }));
    setCache(name, activeWeather);
  }

  function handleRemove(city) {
    setSavedCities((prev) => prev.filter((c) => c !== city));
    setSavedWeather((prev) => {
      const next = { ...prev };
      delete next[city];
      return next;
    });
    removeCache(city);
    if (activeWeather?.location?.name === city) {
      setActiveWeather(null);
    }
  }

  function handleSelectCity(city) {
    const data = savedWeather[city];
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
    const city = activeWeather.location.name;
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveWeather(data);
      setCache(city, data);
      if (savedCities.includes(city)) {
        setSavedWeather((prev) => ({ ...prev, [city]: data }));
      }
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
  const isSaved = activeCity ? savedCities.includes(activeCity) : false;
  const canSave = savedCities.length < 5;
  const astro = activeWeather?.forecast?.forecastday?.[0]?.astro;

  // Close detail overlays when city changes
  useEffect(() => {
    setWindDetailOpen(false);
    setAQIDetailOpen(false);
  }, [activeCity]);

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
        <div className="header-actions">
          {activeWeather && (
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
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          onUseLocation={handleGeolocation}
          geoLoading={geoLoading}
        />

        {error && <div className="error-message">{error}</div>}

        {activeWeather ? (
          <div className="weather-content" key={activeCity}>
            <CurrentWeather
              data={activeWeather}
              isSaved={isSaved}
              canSave={canSave}
              onToggleSave={isSaved ? () => handleRemove(activeCity) : handleSave}
              onShare={handleShare}
              sharing={sharing}
              astro={astro}
              tempUnit={tempUnit}
            />
            <FreshnessLabel city={activeCity} />
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
          activeCity={activeCity}
          onSelect={handleSelectCity}
          onRemove={handleRemove}
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
