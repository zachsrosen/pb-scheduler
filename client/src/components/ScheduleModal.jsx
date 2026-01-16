import React, { useState } from 'react';

export default function ScheduleModal({ project, date, crews, onConfirm, onClose }) {
  const [days, setDays] = useState(project.daysInstall || 2);
  const [crew, setCrew] = useState(project.crew || (crews[0]?.name || ''));

  const customerName = project.name?.split(' | ')[1] || project.name;
  const types = (project.type || 'Service').split(';').filter(t => t.trim()).join(', ');

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay visible" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>📅 Schedule Install</h3>
        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-title">Project</div>
            <div className="modal-row"><span className="modal-label">Customer</span><span>{customerName}</span></div>
            <div className="modal-row"><span className="modal-label">Address</span><span>{project.address}</span></div>
            <div className="modal-row"><span className="modal-label">Location</span><span>{project.location}</span></div>
            <div className="modal-row"><span className="modal-label">Type</span><span>{types}</span></div>
            <div className="modal-row">
              <span className="modal-label">Amount</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${project.amount?.toLocaleString()}</span>
            </div>
            <div className="modal-row">
              <span className="modal-label">Status</span>
              <span style={{ color: project.stage === 'rtb' ? 'var(--rtb)' : 'var(--rtb-blocked)' }}>
                {project.stage === 'rtb' ? '✅ RTB Ready' : '⚠️ Blocked'}
              </span>
            </div>
          </div>

          {(project.systemSize || project.batteries > 0) && (
            <div className="modal-section">
              <div className="modal-section-title">Equipment</div>
              {project.systemSize && <div className="modal-row"><span className="modal-label">System</span><span>{project.systemSize} kW</span></div>}
              {project.batteries > 0 && <div className="modal-row"><span className="modal-label">Batteries</span><span>{project.batteries}x {project.batteryModel || 'Tesla'}</span></div>}
              {project.roofType && <div className="modal-row"><span className="modal-label">Roof</span><span>{project.roofType}</span></div>}
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">Schedule</div>
            <div className="modal-row"><span className="modal-label">Start Date</span><span><strong>{formatDate(date)}</strong></span></div>
            <div className="form-row">
              <label>Days:</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
              />
              <label>Crew:</label>
              <select value={crew} onChange={(e) => setCrew(e.target.value)}>
                {crews.length > 0 ? (
                  crews.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                ) : (
                  <option>No crews available</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn confirm" onClick={() => onConfirm(days, crew)}>Schedule</button>
        </div>
      </div>
    </div>
  );
}
