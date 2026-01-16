/**
 * JSON File-based storage for schedules and crew assignments
 * Compatible with Vercel serverless environment
 */

const fs = require('fs');
const path = require('path');

// Use /tmp for Vercel serverless (writable) or local database folder
const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../database');
const schedulesPath = path.join(dataDir, 'schedules.json');
const crewsPath = path.join(dataDir, 'crews.json');

// In-memory cache for serverless
let schedulesCache = null;
let crewsCache = null;

// Default crews configuration
const defaultCrews = [
  { id: 1, name: 'WESTY Alpha', location: 'Westminster', roofers: 2, electricians: 1, color: '#3b82f6', active: 1 },
  { id: 2, name: 'WESTY Bravo', location: 'Westminster', roofers: 2, electricians: 1, color: '#10b981', active: 1 },
  { id: 3, name: 'DTC Alpha', location: 'Centennial', roofers: 2, electricians: 1, color: '#8b5cf6', active: 1 },
  { id: 4, name: 'DTC Bravo', location: 'Centennial', roofers: 2, electricians: 1, color: '#ec4899', active: 1 },
  { id: 5, name: 'COSP Alpha', location: 'Colorado Springs', roofers: 3, electricians: 1, color: '#f97316', active: 1 },
  { id: 6, name: 'SLO Solar', location: 'San Luis Obispo', roofers: 2, electricians: 1, color: '#06b6d4', active: 1 },
  { id: 7, name: 'SLO Electrical 1', location: 'San Luis Obispo', roofers: 0, electricians: 2, color: '#a855f7', active: 1 },
  { id: 8, name: 'SLO Electrical 2', location: 'San Luis Obispo', roofers: 0, electricians: 2, color: '#14b8a6', active: 1 },
  { id: 9, name: 'CAM Crew', location: 'Camarillo', roofers: 2, electricians: 1, color: '#f43f5e', active: 1 },
  { id: 10, name: 'SBA Alpha', location: 'Santa Barbara', roofers: 2, electricians: 1, color: '#eab308', active: 1 },
  { id: 11, name: 'SBA Bravo', location: 'Santa Barbara', roofers: 2, electricians: 1, color: '#84cc16', active: 1 }
  ];

function ensureDir() {
    if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadSchedules() {
    if (schedulesCache) return schedulesCache;

  try {
        if (fs.existsSync(schedulesPath)) {
                schedulesCache = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
        } else {
                schedulesCache = [];
        }
  } catch (e) {
        console.error('Error loading schedules:', e);
        schedulesCache = [];
  }
    return schedulesCache;
}

function saveSchedules(data) {
    ensureDir();
    schedulesCache = data;
    fs.writeFileSync(schedulesPath, JSON.stringify(data, null, 2));
}

function loadCrews() {
    if (crewsCache) return crewsCache;

  try {
        if (fs.existsSync(crewsPath)) {
                crewsCache = JSON.parse(fs.readFileSync(crewsPath, 'utf8'));
        } else {
                crewsCache = [...defaultCrews];
                saveCrews(crewsCache);
        }
  } catch (e) {
        console.error('Error loading crews:', e);
        crewsCache = [...defaultCrews];
  }
    return crewsCache;
}

function saveCrews(data) {
    ensureDir();
    crewsCache = data;
    fs.writeFileSync(crewsPath, JSON.stringify(data, null, 2));
}

function initialize() {
    ensureDir();
    loadSchedules();
    loadCrews();
    console.log('Database initialized');
}

// Schedule CRUD operations
const schedules = {
    getAll() {
          return loadSchedules().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    },

    getByProjectId(projectId) {
          return loadSchedules().find(s => s.project_id === projectId);
    },

    upsert(schedule) {
          const data = loadSchedules();
          const idx = data.findIndex(s => s.project_id === schedule.project_id);

      const record = {
              ...schedule,
              updated_at: new Date().toISOString()
      };

      if (idx >= 0) {
              data[idx] = { ...data[idx], ...record };
      } else {
              record.id = data.length ? Math.max(...data.map(s => s.id || 0)) + 1 : 1;
              record.created_at = new Date().toISOString();
              data.push(record);
      }

      saveSchedules(data);
          return { changes: 1 };
    },

    delete(projectId) {
          const data = loadSchedules();
          const filtered = data.filter(s => s.project_id !== projectId);
          saveSchedules(filtered);
          return { changes: data.length - filtered.length };
    }
};

// Crew operations
const crews = {
    getAll() {
          return loadCrews().filter(c => c.active === 1).sort((a, b) => {
                  if (a.location !== b.location) return a.location.localeCompare(b.location);
                  return a.name.localeCompare(b.name);
          });
    },

    getByLocation(location) {
          return loadCrews().filter(c => c.location === location && c.active === 1);
    },

    update(id, data) {
          const allCrews = loadCrews();
          const idx = allCrews.findIndex(c => c.id === id);
          if (idx >= 0) {
                  allCrews[idx] = { ...allCrews[idx], ...data };
                  saveCrews(allCrews);
                  return { changes: 1 };
          }
          return { changes: 0 };
    }
};

// Activity logging (simplified - just console log for now)
function logActivity(action, projectId, userEmail, details) {
    console.log(`[ACTIVITY] ${action} - Project: ${projectId} - User: ${userEmail}`, details);
}

module.exports = { initialize, schedules, crews, logActivity };
