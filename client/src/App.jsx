import React, { useState, useEffect, useCallback } from 'react';
import { hubspot, schedules } from './api';
import Calendar from './components/Calendar';
import Queue from './components/Queue';
import RightPanel from './components/RightPanel';
import Toast from './components/Toast';
import ScheduleModal from './components/ScheduleModal';

const LOCATIONS = ['All', 'Westminster', 'Centennial', 'Colorado Springs', 'San Luis Obispo', 'Camarillo'];

export default function App() {
  // State
  const [projects, setProjects] = useState([]);
  const [localSchedules, setLocalSchedules] = useState({});
  const [crews, setCrews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [toast, setToast] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load projects from HubSpot
      const projectsRes = await hubspot.getProjects(selectedLocation);
      setProjects(projectsRes.projects || []);

      // Load local schedules
      const schedulesRes = await schedules.getAll();
      const schedulesMap = {};
      (schedulesRes.schedules || []).forEach(s => {
        schedulesMap[s.project_id] = s;
      });
      setLocalSchedules(schedulesMap);

      // Load crews
      const crewsRes = await schedules.getCrews();
      setCrews(crewsRes.crews || {});

    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Schedule a project
  const handleSchedule = async (projectId, startDate, days, crew) => {
    try {
      await schedules.save({
        project_id: projectId,
        start_date: startDate,
        days,
        crew
      });

      // Update local state
      setLocalSchedules(prev => ({
        ...prev,
        [projectId]: { project_id: projectId, start_date: startDate, days, crew }
      }));

      const project = projects.find(p => p.id === projectId);
      showToast(`✅ ${project?.name?.split(' | ')[1] || 'Project'} scheduled for ${new Date(startDate).toLocaleDateString()}`);
      setModalData(null);
      setSelectedProject(null);
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  // Auto-optimize
  const handleAutoOptimize = async () => {
    const rtbProjects = projects.filter(p =>
      p.stage === 'rtb' && !localSchedules[p.id] && !p.scheduleDate
    );

    if (rtbProjects.length === 0) {
      showToast('No unscheduled RTB projects to optimize', 'error');
      return;
    }

    // Sort by revenue
    rtbProjects.sort((a, b) => b.amount - a.amount);

    // Get next available dates per crew
    const crewNextDate = {};
    const today = new Date();
    today.setDate(today.getDate() + 1);

    Object.values(crews).flat().forEach(c => {
      crewNextDate[c.name] = getNextWorkday(today);
    });

    // Assign schedules
    const newSchedules = [];
    rtbProjects.forEach(p => {
      const preferredCrew = p.crew;
      if (preferredCrew && crewNextDate[preferredCrew]) {
        const startDate = crewNextDate[preferredCrew];
        newSchedules.push({
          project_id: p.id,
          start_date: startDate,
          days: p.daysInstall || 2,
          crew: preferredCrew
        });
        crewNextDate[preferredCrew] = getNextWorkday(addDays(startDate, p.daysInstall || 2));
      }
    });

    try {
      await schedules.saveBulk(newSchedules);
      showToast(`⚡ Auto-scheduled ${newSchedules.length} projects by revenue priority`);
      loadData();
    } catch (err) {
      showToast(`Auto-optimize failed: ${err.message}`, 'error');
    }
  };

  // Helper functions
  function getNextWorkday(date) {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (selectedLocation !== 'All' && p.location !== selectedLocation) return false;
    if (selectedStage !== 'all' && p.stage !== selectedStage) return false;
    return true;
  });

  // Get scheduled events
  const getScheduledEvents = () => {
    const events = [];

    projects.forEach(p => {
      const localSched = localSchedules[p.id];
      if (localSched) {
        events.push({ ...p, date: localSched.start_date, days: localSched.days, crew: localSched.crew, eventType: 'scheduled' });
      } else if (p.scheduleDate) {
        events.push({ ...p, date: p.scheduleDate, eventType: p.stage });
      }
    });

    return events;
  };

  // Detect conflicts
  const detectConflicts = () => {
    const events = getScheduledEvents();
    const conflicts = [];
    const crewSchedules = {};

    events.forEach(e => {
      if (!e.crew) return;
      if (!crewSchedules[e.crew]) crewSchedules[e.crew] = [];

      const start = new Date(e.date);
      for (let i = 0; i < (e.days || 1); i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        crewSchedules[e.crew].push({ date: d.toISOString().split('T')[0], project: e });
      }
    });

    Object.entries(crewSchedules).forEach(([crew, days]) => {
      const dateMap = {};
      days.forEach(d => {
        if (!dateMap[d.date]) dateMap[d.date] = [];
        dateMap[d.date].push(d.project);
      });

      Object.entries(dateMap).forEach(([date, projects]) => {
        if (projects.length > 1) {
          conflicts.push({ crew, date, projects: projects.map(p => p.name?.split(' | ')[1] || p.name) });
        }
      });
    });

    return conflicts;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading from HubSpot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>⚠️ Connection Error</h2>
        <p>{error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Left Sidebar - Queue */}
      <Queue
        projects={filteredProjects}
        localSchedules={localSchedules}
        selectedProject={selectedProject}
        selectedStage={selectedStage}
        onSelectProject={setSelectedProject}
        onSelectStage={setSelectedStage}
      />

      {/* Main - Calendar */}
      <main className="main">
        <div className="view-tabs">
          {['calendar', 'week', 'gantt'].map(view => (
            <div
              key={view}
              className={`view-tab ${currentView === view ? 'active' : ''}`}
              onClick={() => setCurrentView(view)}
            >
              {view === 'calendar' ? '📅 Month' : view === 'week' ? '📊 Week' : '📈 Gantt'}
            </div>
          ))}
        </div>

        <div className="location-tabs">
          {LOCATIONS.map(loc => {
            const locProjects = loc === 'All' ? projects : projects.filter(p => p.location === loc);
            const revenue = (locProjects.reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(0);
            return (
              <div
                key={loc}
                className={`location-tab ${selectedLocation === loc ? 'active' : ''}`}
                onClick={() => setSelectedLocation(loc)}
              >
                {loc} <span className="count">{locProjects.length}</span>
                <span className="revenue">${revenue}K</span>
              </div>
            );
          })}
        </div>

        <Calendar
          view={currentView}
          events={getScheduledEvents()}
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedProject={selectedProject}
          selectedLocation={selectedLocation}
          crews={crews}
          onMonthChange={(m, y) => { setCurrentMonth(m); setCurrentYear(y); }}
          onDayClick={(date) => {
            if (selectedProject && selectedProject.stage !== 'construction') {
              setModalData({ project: selectedProject, date });
            }
          }}
          onEventClick={(projectId) => {
            const p = projects.find(pr => pr.id === projectId);
            if (p) window.open(p.hubspotUrl, '_blank');
          }}
        />
      </main>

      {/* Right Panel */}
      <RightPanel
        crews={crews}
        selectedLocation={selectedLocation}
        events={getScheduledEvents()}
        conflicts={detectConflicts()}
        onAutoOptimize={handleAutoOptimize}
        onExportCSV={() => {
          // Export logic
          const events = getScheduledEvents();
          let csv = 'Project,Customer,Address,Amount,Schedule Date,Days,Crew\n';
          events.forEach(e => {
            csv += `"${e.name}","${e.name?.split(' | ')[1]}","${e.address}",${e.amount},${e.date},${e.days || 2},"${e.crew || ''}"\n`;
          });
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pb-schedule-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          showToast('📥 CSV exported');
        }}
      />

      {/* Schedule Modal */}
      {modalData && (
        <ScheduleModal
          project={modalData.project}
          date={modalData.date}
          crews={crews[modalData.project.location] || []}
          onConfirm={(days, crew) => handleSchedule(modalData.project.id, modalData.date, days, crew)}
          onClose={() => setModalData(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
