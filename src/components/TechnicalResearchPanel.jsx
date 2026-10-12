import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, SparklesIcon, ExternalLinkIcon, CopyIcon, CheckIcon, AlertCircleIcon, EditIcon } from './Icons';

export function TechnicalResearchPanel({
  targetSegment,
  onClearTargetSegment,
  onApplyCorrectionToSegment,
  segments = [],
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(null); // null = unknown, true = key set, false = missing key
  const [copiedTerm, setCopiedTerm] = useState(null);
  const prevTargetIdRef = useRef(targetSegment?.id);

  // Sync query when a new target segment is selected
  if (targetSegment && targetSegment.id !== prevTargetIdRef.current) {
    prevTargetIdRef.current = targetSegment.id;
    setQuery(targetSegment.text);
    setError(null);
  }

  // Check backend SerpApi configuration status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok && isMounted) {
          const data = await res.json();
          setIsConfigured(Boolean(data.configured));
        } else if (isMounted) {
          setIsConfigured(false);
        }
      } catch (_e) {
        if (isMounted) setIsConfigured(false);
      }
    }
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === 'MISSING_API_KEY') {
          setIsConfigured(false);
          setError({
            type: 'MISSING_API_KEY',
            message: data.message || 'SerpApi key is not configured in the server .env file.',
          });
        } else if (data.error === 'INVALID_API_KEY') {
          setError({
            type: 'INVALID_API_KEY',
            message: 'Invalid SerpApi key provided in .env. Please verify your credentials.',
          });
        } else if (data.error === 'RATE_LIMIT') {
          setError({
            type: 'RATE_LIMIT',
            message: 'SerpApi search limit reached. Please check your account quota.',
          });
        } else {
          setError({
            type: 'API_ERROR',
            message: data.message || 'Search request failed. Please check your connection and try again.',
          });
        }
        setResults(null);
        setKnowledgeGraph(null);
        return;
      }

      setIsConfigured(true);
      setResults(data.results || []);
      setKnowledgeGraph(data.knowledgeGraph || null);
    } catch (err) {
      console.warn('Search fetch error:', err);
      setError({
        type: 'NETWORK_ERROR',
        message: 'Could not connect to the backend research server. Ensure the server is running on port 3001.',
      });
      setResults(null);
      setKnowledgeGraph(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSelectChip = (term) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleCopyText = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTerm(id);
      setTimeout(() => setCopiedTerm(null), 2000);
    } catch (_e) {
      // ignore
    }
  };

  const sampleTopics = ['Kubernetes', 'WebAssembly', 'Ray Tracing', 'Next.js 15', 'CUDA', 'PyTorch'];

  return (
    <div className="research-panel-card">
      {/* Panel Header */}
      <div className="research-header">
        <div className="research-title-row">
          <div className="research-icon-box">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="research-title-text">
            <div className="research-badge-row">
              <h3 className="research-title">Technical Term Research</h3>
              <span
                className={`research-status-pill ${
                  isConfigured === true
                    ? 'pill-live'
                    : isConfigured === false
                    ? 'pill-missing'
                    : 'pill-checking'
                }`}
                title={
                  isConfigured
                    ? 'SerpApi Google Search API is connected'
                    : 'Add SERPAPI_KEY to your server .env file to enable live searches'
                }
              >
                <span className="status-dot-sm"></span>
                {isConfigured === true
                  ? 'SerpApi Connected'
                  : isConfigured === false
                  ? 'Key Required (.env)'
                  : 'Checking Status'}
              </span>
            </div>
            <p className="research-subtitle">
              Verify spellings, technical definitions, and documentation links for your live stream transcript.
            </p>
          </div>
        </div>
      </div>

      {/* Target Segment Link (if user clicked research on a segment) */}
      {targetSegment && (
        <div className="research-target-banner">
          <div className="target-banner-info">
            <span className="target-badge">Target #{targetSegment.index}</span>
            <span className="target-text">"{targetSegment.text}"</span>
          </div>
          {onClearTargetSegment && (
            <button
              onClick={onClearTargetSegment}
              className="btn-clear-target"
              title="Clear selected segment target"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Search Input Form */}
      <form onSubmit={handleFormSubmit} className="research-search-form">
        <div className="research-input-wrapper">
          <SearchIcon className="w-4 h-4 text-slate-400 search-input-icon" />
          <input
            type="text"
            className="research-input"
            placeholder="Search term, library, or product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-research-submit"
          >
            {loading ? (
              <>
                <span className="spinner-sm"></span>
                <span>Searching...</span>
              </>
            ) : (
              <span>Search Google</span>
            )}
          </button>
        </div>
      </form>

      {/* Quick Select from Transcript Dropdown (if segments exist) */}
      {segments.length > 0 && (
        <div className="transcript-picker-row">
          <span className="transcript-picker-label">Select phrase from transcript:</span>
          <select
            className="transcript-picker-select"
            onChange={(e) => {
              if (e.target.value) {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              -- Choose a finalized segment --
            </option>
            {segments.map((seg) => (
              <option key={seg.id} value={seg.text}>
                #{seg.index}: {seg.text.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Suggestion Chips */}
      <div className="research-chips-section">
        <span className="research-chips-label">Popular Topics:</span>
        <div className="research-chips-list">
          {sampleTopics.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSelectChip(term)}
              className="research-chip"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Graceful Error & Guidance Banner */}
      {error && (
        <div className="research-error-card">
          <div className="research-error-icon">
            <AlertCircleIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="research-error-text">
            <h4 className="research-error-title">
              {error.type === 'MISSING_API_KEY'
                ? 'SerpApi Key Configuration Needed'
                : error.type === 'INVALID_API_KEY'
                ? 'Invalid SerpApi Key'
                : error.type === 'RATE_LIMIT'
                ? 'SerpApi Rate Limit Reached'
                : 'Research Query Notice'}
            </h4>
            <p className="research-error-desc">{error.message}</p>
            {error.type === 'MISSING_API_KEY' && (
              <div className="research-env-guide">
                <p>
                  To enable live Google Search results:
                </p>
                <ol className="env-steps">
                  <li>Open the <code>.env</code> file in your project folder.</li>
                  <li>Set <code>SERPAPI_KEY=YOUR_ACTUAL_KEY</code> with your personal key.</li>
                  <li>Restart the backend server (<code>npm run server</code>).</li>
                </ol>
                <span className="env-safety-note">
                  🔒 Your key is never shared or exposed in client requests.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results View */}
      {results && results.length > 0 && (
        <div className="research-results-container">
          <div className="results-header">
            <span className="results-count-tag">
              Found {results.length} Google Results for "{query}"
            </span>
          </div>

          {/* Knowledge Graph Card (if present) */}
          {knowledgeGraph && (
            <div className="knowledge-graph-card">
              <div className="kg-header">
                <span className="kg-type">{knowledgeGraph.type || 'Knowledge Summary'}</span>
                <button
                  onClick={() => handleCopyText(knowledgeGraph.title, 'kg')}
                  className="btn-kg-copy"
                  title="Copy accurate spelling"
                >
                  {copiedTerm === 'kg' ? (
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedTerm === 'kg' ? 'Copied' : 'Copy Name'}</span>
                </button>
              </div>
              <h4 className="kg-title">{knowledgeGraph.title}</h4>
              {knowledgeGraph.description && (
                <p className="kg-description">{knowledgeGraph.description}</p>
              )}
              {knowledgeGraph.source && (
                <a
                  href={knowledgeGraph.source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kg-source-link"
                >
                  <span>Source: {knowledgeGraph.source.name}</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Organic Results List */}
          <div className="organic-results-list">
            {results.map((res, idx) => (
              <div key={idx} className="organic-result-card">
                <div className="result-top-line">
                  <span className="result-rank">#{res.position}</span>
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-title-link"
                  >
                    <span>{res.title}</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5 result-ext-icon" />
                  </a>
                </div>

                {res.source && <span className="result-source-domain">{res.source}</span>}

                <p className="result-snippet">{res.snippet}</p>

                <div className="result-actions-row">
                  <button
                    onClick={() => handleCopyText(res.title, `res_${idx}`)}
                    className="btn-result-action"
                    title="Copy title to clipboard"
                  >
                    {copiedTerm === `res_${idx}` ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3.5 h-3.5" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>

                  {targetSegment && onApplyCorrectionToSegment && (
                    <button
                      onClick={() => onApplyCorrectionToSegment(targetSegment.id, res.title)}
                      className="btn-result-action btn-apply-correction"
                      title={`Review and manually correct Segment #${targetSegment.index}`}
                    >
                      <EditIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Apply to Segment #{targetSegment.index}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty / Zero Results State */}
      {results && results.length === 0 && !error && (
        <div className="research-zero-results">
          <p>No organic Google search results found for "{query}". Try refining the query.</p>
        </div>
      )}
    </div>
  );
}

