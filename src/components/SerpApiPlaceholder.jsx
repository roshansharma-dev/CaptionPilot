import React, { useState } from 'react';
import { SearchIcon, SparklesIcon } from './Icons';

export function SerpApiPlaceholder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const sampleTerms = ['Kubernetes', 'WebAssembly', 'Ray Tracing', 'Next.js 15', 'CUDA', 'LoRA'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setStatusMessage(`SerpApi technical term lookup for "${searchTerm.trim()}" is scheduled for the upcoming integration.`);
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  const handleSelectChip = (term) => {
    setSearchTerm(term);
  };

  return (
    <div className="serp-placeholder-card">
      <div className="serp-header">
        <div className="serp-title-wrap">
          <div className="serp-icon-box">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="serp-badge-row">
              <h3 className="serp-title">Technical Term Research</h3>
              <span className="serp-future-badge">SerpApi • Coming Soon</span>
            </div>
            <p className="serp-subtitle">
              Instant Google search definitions, pronunciations, and technical summaries for your stream audience.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="serp-search-form">
        <div className="serp-input-group">
          <SearchIcon className="w-4 h-4 text-slate-400 serp-input-icon" />
          <input
            type="text"
            className="serp-input"
            placeholder="Search tech term (e.g., Kubernetes, WebAssembly, CUDA)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-serp-search">
            Search Term
          </button>
        </div>
      </form>

      {statusMessage && (
        <div className="serp-status-notice">
          ℹ️ {statusMessage}
        </div>
      )}

      <div className="serp-chips-section">
        <span className="serp-chips-label">Popular Creator Topics:</span>
        <div className="serp-chips-list">
          {sampleTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSelectChip(term)}
              className="serp-chip"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="serp-preview-info">
        <div className="serp-info-point">
          <span className="serp-info-bullet">💡</span>
          <span><strong>Automatic Term Detection:</strong> Future versions will parse spoken terminology from your live transcript and fetch SerpApi definitions in real time.</span>
        </div>
        <div className="serp-info-point">
          <span className="serp-info-bullet">🛡️</span>
          <span><strong>Safe MVP:</strong> No mock or unauthorized API calls are executed. Ready for direct SerpApi credential configuration in the next milestone.</span>
        </div>
      </div>
    </div>
  );
}
