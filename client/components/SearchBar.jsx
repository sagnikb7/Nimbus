import { useState, useEffect, useRef } from 'react';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;

export default function SearchBar({ onSearch, onSelectPlace, loading, onUseLocation, geoLoading }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const cacheRef = useRef(new Map()); // lowercased query -> results array
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  // Debounced autocomplete fetch with in-memory cache + abort of stale requests
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setOpen(false);
      return;
    }

    const key = q.toLowerCase();
    if (cacheRef.current.has(key)) {
      setResults(cacheRef.current.get(key));
      setOpen(true);
      setActive(-1);
      return;
    }

    const id = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        // Open-Meteo geocoding API — keyless, CORS-open, GeoNames-backed
        // (CC-BY 4.0). Far richer dataset than WeatherAPI's search.json:
        // returns admin hierarchy + population + timezone for every match.
        const url =
          `https://geocoding-api.open-meteo.com/v1/search` +
          `?name=${encodeURIComponent(q)}&count=${MAX_RESULTS}&language=en&format=json`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        // Normalize Open-Meteo fields to the shape downstream code expects
        // ({ name, region, country, lat, lon }) so App.jsx + Cache stay untouched.
        // `district` (admin2) is dropdown-only and surfaces when admin1 alone is
        // ambiguous (e.g. three "Medinipur · Odisha · India" rows become
        // "Ganjam, Odisha" / "Cuttack, Odisha" / "Khordha, Odisha").
        const sliced = (data.results || []).slice(0, MAX_RESULTS).map((r) => ({
          id: r.id,
          name: r.name,
          region: r.admin1,
          district: r.admin2,
          country: r.country,
          lat: r.latitude,
          lon: r.longitude,
        }));
        cacheRef.current.set(key, sliced);
        setResults(sliced);
        setOpen(true);
        setActive(-1);
      } catch {
        // aborted or network error — ignore
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function selectPlace(place) {
    setQuery('');
    setResults([]);
    setOpen(false);
    setActive(-1);
    onSelectPlace(place);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (open && active >= 0 && results[active]) {
      selectPlace(results[active]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed) {
      setOpen(false);
      onSearch(trimmed);
    }
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="search-wrap" ref={containerRef}>
      <form className="search-bar" onSubmit={handleSubmit} autoComplete="off">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m17 17 4 4" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a city..."
          autoFocus
          role="combobox"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-autocomplete="list"
        />
        {loading && <div className="search-spinner" />}
        {!loading && (
          <button
            type="button"
            className="location-btn"
            onClick={onUseLocation}
            disabled={geoLoading}
            title="Use my location"
          >
            {geoLoading ? (
              <div className="search-spinner location-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
          </button>
        )}
      </form>

      {open && results.length > 0 && (
        <ul className="search-suggestions" id="search-listbox" role="listbox">
          {results.map((place, i) => {
            // Show district only when it adds info (present + distinct from region)
            const admin =
              place.district && place.district !== place.region
                ? `${place.district}, ${place.region}`
                : place.region;
            const subtitle = [admin, place.country].filter(Boolean).join(' · ');
            return (
              <li
                key={place.id ?? `${place.lat},${place.lon}`}
                role="option"
                aria-selected={i === active}
                className={`search-suggestion${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectPlace(place);
                }}
              >
                <svg className="suggestion-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="suggestion-text">
                  <span className="suggestion-name">{place.name}</span>
                  <span className="suggestion-region">{subtitle}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
