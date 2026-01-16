import React, { useState } from 'react';

export default function Queue({
  projects,
  localSchedules,
  selectedProject,
  selectedStage,
  onSelectProject,
  onSelectStage
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('amount');

  // Filter and sort
  let filtered = projects.filter(p => {
    if (selectedStage !== 'all' && p.stage !== selectedStage) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && (!p.type || !p.type.includes(typeFilter))) return false;
    return true;
  });

  if (sortBy === 'amount') filtered.sort((a, b) => b.amount - a.amount);
  else if (sortBy === 'date') filtered.sort((a, b) => (a.scheduleDate || 'z').localeCompare(b.scheduleDate || 'z'));
  else if (sortBy === 'days') filtered.sort((a, b) => (a.daysInstall || 1) - (b.daysInstall || 1));

  const totalRevenue = (filtered.reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(0);

  const formatCurrency = (amount) => '$' + (amount / 1000).toFixed(1) + 'K';
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="sidebar">
      <header>
        <div className="header-row">
          <div>
            <h1>⚡ PB Master Scheduler</h1>
            <div className="subtitle">Live HubSpot Data • Real-time Sync</div>
          </div>
        </div>
      </header>

      <div className="queue-header">
        <h2>📋 Install Pipeline</h2>
        <div className="stage-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'construction', label: '🔨 Build', className: 'construction' },
            { key: 'rtb', label: '✅ RTB', className: 'rtb' },
            { key: 'blocked', label: '⚠️ Blocked', className: 'blocked' }
          ].map(stage => (
            <div
              key={stage.key}
              className={`stage-tab ${stage.className || ''} ${selectedStage === stage.key ? 'active' : ''}`}
              onClick={() => onSelectStage(stage.key)}
            >
              {stage.label}
            </div>
          ))}
        </div>
        <div className="queue-filters">
          <input
            type="text"
            placeholder="🔍 Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Solar">☀️ Solar</option>
            <option value="Battery">🔋 Battery</option>
            <option value="EV">🔌 EV Charger</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="amount">Sort: Revenue ↓</option>
            <option value="date">Sort: Date</option>
            <option value="days">Sort: Install Days</option>
          </select>
        </div>
      </div>

      <div className="queue-count">
        <span>{filtered.length} projects</span>
        <span>${totalRevenue}K</span>
      </div>

      <div className="queue-list">
        {filtered.map(p => {
          const customerName = p.name?.split(' | ')[1] || p.name;
          const types = (p.type || '').split(';').filter(t => t.trim());
          const stageLabel = p.stage === 'construction' ? '🔨' : p.stage === 'rtb' ? '✅' : '⚠️';
          const localSched = localSchedules[p.id];
          const isScheduled = localSched || p.scheduleDate;
          const scheduleDate = localSched?.start_date || p.scheduleDate;

          return (
            <div
              key={p.id}
              className={`queue-item ${p.stage} ${selectedProject?.id === p.id ? 'selected' : ''}`}
              onClick={() => onSelectProject(p)}
            >
              <div className="queue-item-header">
                <div className="queue-item-name" title={p.name}>{customerName}</div>
                <div className="queue-item-amount">{formatCurrency(p.amount)}</div>
              </div>
              <div className="queue-item-address" title={p.address}>{p.address}</div>
              <div className="queue-item-meta">
                <span className={`queue-item-tag ${p.stage}`}>{stageLabel} {p.stage}</span>
                {isScheduled && <span className="queue-item-tag scheduled">📅 {formatShortDate(scheduleDate)}</span>}
                {types.slice(0, 2).map((t, i) => {
                  const cls = t.toLowerCase().includes('solar') ? 'solar' : t.toLowerCase().includes('battery') ? 'battery' : '';
                  return <span key={i} className={`queue-item-tag ${cls}`}>{t.trim()}</span>;
                })}
              </div>
              <div className="queue-item-specs">
                {p.systemSize && <span className="spec"><strong>{p.systemSize}</strong> kW</span>}
                {p.batteries > 0 && <span className="spec"><strong>{p.batteries}</strong> batt</span>}
                {p.daysInstall && <span className="spec"><strong>{p.daysInstall}</strong>d</span>}
                {p.crew && <span className="spec">{p.crew}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
