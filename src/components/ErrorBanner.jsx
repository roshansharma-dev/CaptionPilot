import React from 'react';
import { AlertCircleIcon } from './Icons';

export function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isUnsupported = error.type === 'UNSUPPORTED_BROWSER';
  const isPermission = error.type === 'PERMISSION_DENIED';

  return (
    <div className="error-banner" role="alert">
      <div className="error-icon-box">
        <AlertCircleIcon className="w-6 h-6 text-red-400" />
      </div>
      <div className="error-content">
        <h4 className="error-title">{error.title || 'Speech Recognition Error'}</h4>
        <p className="error-description">{error.message}</p>

        {isUnsupported && (
          <div className="error-guidance">
            <strong>Recommended browsers:</strong>
            <div className="browser-tags">
              <span className="browser-tag">Google Chrome</span>
              <span className="browser-tag">Microsoft Edge</span>
              <span className="browser-tag">Brave</span>
              <span className="browser-tag">Opera</span>
            </div>
            <p className="error-subtext">
              Note: Firefox and Safari currently do not support the continuous Web Speech Recognition API natively.
            </p>
          </div>
        )}

        {isPermission && (
          <div className="error-guidance">
            <p className="error-subtext">
              💡 <strong>Quick Fix:</strong> Click the padlock or camera/mic icon on the left side of your browser URL bar, set <em>Microphone</em> to <strong>Allow</strong>, and click Retry below.
            </p>
          </div>
        )}
      </div>

      <div className="error-actions">
        {onRetry && (
          <button className="btn-retry" onClick={onRetry}>
            Retry Mic Access
          </button>
        )}
        {onDismiss && (
          <button className="btn-dismiss" onClick={onDismiss} aria-label="Dismiss error">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
