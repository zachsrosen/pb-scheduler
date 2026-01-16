import React from 'react';

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function Calendar({
  view,
  events,
  currentMonth,
  currentYear,
  selectedProject,
  selectedLocation,
  crews,
  onMonthChange,
  onDayClick,
  onEventClick
}) {
  const today = new Date();

  const prevMonth = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    onMonthChange(m, y);
  };

  const nextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    onMonthChange(m, y);
  };

  // Group events by date
  const eventsByDate = {};
  events.forEach(e => {
    if (selectedLocation !== 'All' && e.location !== selectedLocation) return;
    const startDate = new Date(e.date);
    for (let i = 0; i < (e.days || 1); i++) {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + i);
      if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
        const day = eventDate.getDate();
        if (!eventsByDate[day]) eventsByDate[day] = [];
        eventsByDate[day].push({ ...e, dayNum: i + 1, totalDays: e.days || 1 });
      }
    }
  });

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const renderCalendarView = () => {
    const cells = [];

    // Day headers
    DAY_NAMES.forEach(d => {
      cells.push(<div key={`header-${d}`} className="day-header">{d}</div>);
    });

    // Previous month padding
    const prevDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push(<div key={`prev-${i}`} className="day other-month"><div className="day-number">{prevDays - i}</div></div>);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dayEvents = eventsByDate[day] || [];
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      cells.push(
        <div
          key={`day-${day}`}
          className={`day${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}${selectedProject ? ' drop-target' : ''}`}
          onClick={() => onDayClick(dateStr)}
        >
          <div className="day-number">{day}</div>
          {dayEvents.slice(0, 4).map((e, idx) => {
            const shortName = (e.name?.split(' | ')[1] || e.name || '').substring(0, 8);
            const dayLabel = e.totalDays > 1 ? `D${e.dayNum} ` : '';
            return (
              <div
                key={`event-${e.id}-${idx}`}
                className={`event ${e.eventType || e.stage}`}
                onClick={(ev) => { ev.stopPropagation(); onEventClick(e.id); }}
                title={`${e.name} - ${e.crew || 'No crew'}`}
              >
                {dayLabel}{shortName}
              </div>
            );
          })}
          {dayEvents.length > 4 && <div className="more-events">+{dayEvents.length - 4}</div>}
        </div>
      );
    }

    // Next month padding
    const total = startDay + daysInMonth;
    const rem = 7 - (total % 7);
    if (rem < 7) {
      for (let i = 1; i <= rem; i++) {
        cells.push(<div key={`next-${i}`} className="day other-month"><div className="day-number">{i}</div></div>);
      }
    }

    return cells;
  };

  if (view !== 'calendar') {
    return (
      <div className="calendar-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          {view === 'week' ? '📊 Week view - Coming in React version' : '📈 Gantt view - Coming in React version'}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {selectedProject && selectedProject.stage !== 'construction' && (
        <div className="instructions">
          📅 <strong>{selectedProject.name?.split(' | ')[1]}</strong> selected — click a day to schedule
        </div>
      )}

      <div className="month-nav">
        <button onClick={prevMonth}>← Prev</button>
        <div className="month-title">{MONTH_NAMES[currentMonth]} {currentYear}</div>
        <button onClick={nextMonth}>Next →</button>
        <button className="today-btn" onClick={() => onMonthChange(today.getMonth(), today.getFullYear())}>Today</button>
      </div>

      <div className="calendar">
        {renderCalendarView()}
      </div>
    </div>
  );
}
