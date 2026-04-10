import { useState } from 'react';

export default function SearchBar({ onSearch, loading, onUseLocation, geoLoading }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
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
        placeholder="Search for a city..."
        autoFocus
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
  );
}
