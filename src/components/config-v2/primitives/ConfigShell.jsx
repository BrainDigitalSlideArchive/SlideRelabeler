import React from 'react';

/**
 * Scroll root + sticky nav host for the Configuration dialog.
 */
export default function ConfigShell({ nav, children, badge }) {
  return (
    <div className="cfg-shell">
      {badge ? (
        <div className="cfg-shell__badge-row">
          <span className="cfg-shell__badge">{badge}</span>
        </div>
      ) : null}
      {nav}
      <div className="cfg-shell__body config-v2__body">
        <div className="cfg-shell__controls">
          {children}
        </div>
      </div>
    </div>
  );
}
