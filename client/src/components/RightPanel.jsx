import React from 'react';

export default function RightPanel({
  crews,
  selectedLocation,
  events,
  conflicts,
  onAutoOptimize,
  onExportCSV
}) {
  const locationCrews = selectedLocation === 'All' ? [] : (crews[selectedLocation] || []);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="right-panel">
      <div className="panel-section">
        <div className="panel-title">🤖 Auto-Optimize</div>
        <button className="optimize-btn" onClick={onAutoOptimize}>⚡ Optimize Schedule</button>
        <div className="optimize-stats">
          Click to auto-schedule RTB projects by revenue priority
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">👷 Crew Capacity</div>
        <div id="crewCapacity">
          {selectedLocation === 'All' ? (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Select location to view crews</div>
          ) : (
            locationCrews.map(c => {
              const crewEvents = events.filter(e => e.crew === c.name);
              const totalDays = crewEvents.reduce((sum, e) => sum + (e.days || 1), 0);
              const utilization = Math.min(100, Math.round((totalDays / 10) * 100));
              const utilizationClass = utilization > 90 ? 'full' : utilization > 70 ? 'warning' : '';

              return (
                <div key={c.name} className="crew-card">
                  <div className="crew-name" style={{ color: c.color }}>{c.name}</div>
                  <div className="crew-capacity">
                    {c.roofers > 0 && <span className="capacity-item">👷 {c.roofers}</span>}
                    {c.electricians > 0 && <span className="capacity-item">⚡ {c.electricians}</span>}
                  </div>
                  <div className="crew-utilization">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="capacity-bar" style={{ width: '100px' }}>
                        <div className={`capacity-fill ${utilizationClass}`} style={{ width: `${utilization}%` }}></div>
                      </div>
                      <span>{utilization}% ({crewEvents.length} jobs)</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">⚠️ Conflicts ({conflicts.length})</div>
        <div id="conflictList">
          {conflicts.length === 0 ? (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>✅ No scheduling conflicts</div>
          ) : (
            conflicts.map((c, i) => (
              <div key={i} className="conflict-item">
                <div className="conflict-title">⚠️ {c.crew} - {formatShortDate(c.date)}</div>
                <div className="conflict-detail">{c.projects.join(', ')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">📤 Export</div>
        <div className="export-btns">
          <button className="export-btn" onClick={onExportCSV}>📥 Download CSV</button>
          <button className="export-btn" onClick={() => alert('iCal export coming soon')}>📅 Export iCal</button>
          <button className="export-btn" onClick={() => {
            const text = events.map(e => `${e.date} - ${e.name?.split(' | ')[1]} - ${e.crew}`).join('\n');
            navigator.clipboard.writeText(text);
          }}>📋 Copy to Clipboard</button>
        </div>
      </div>
    </aside>
  );
}
