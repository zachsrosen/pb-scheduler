/**
 * SQLite Database for storing schedules and crew assignments
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/scheduler.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initialize() {
  const database = getDb();

  // Schedules table - stores manual schedule assignments
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      days INTEGER DEFAULT 2,
      crew TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crews table - stores crew configurations
  database.exec(`
    CREATE TABLE IF NOT EXISTS crews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      roofers INTEGER DEFAULT 2,
      electricians INTEGER DEFAULT 1,
      color TEXT DEFAULT '#3b82f6',
      active INTEGER DEFAULT 1
    )
  `);

  // Activity log for audit trail
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      project_id TEXT,
      user_email TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default crews if empty
  const crewCount = database.prepare('SELECT COUNT(*) as count FROM crews').get();
  if (crewCount.count === 0) {
    const insertCrew = database.prepare(`
      INSERT INTO crews (name, location, roofers, electricians, color) VALUES (?, ?, ?, ?, ?)
    `);

    const defaultCrews = [
      ['WESTY Alpha', 'Westminster', 2, 1, '#3b82f6'],
      ['WESTY Bravo', 'Westminster', 2, 1, '#10b981'],
      ['DTC Alpha', 'Centennial', 2, 1, '#8b5cf6'],
      ['DTC Bravo', 'Centennial', 2, 1, '#ec4899'],
      ['COSP Alpha', 'Colorado Springs', 3, 1, '#f97316'],
      ['SLO Solar', 'San Luis Obispo', 2, 1, '#06b6d4'],
      ['SLO Electrical 1', 'San Luis Obispo', 0, 2, '#a855f7'],
      ['SLO Electrical 2', 'San Luis Obispo', 0, 2, '#14b8a6'],
      ['CAM Crew', 'Camarillo', 2, 1, '#f43f5e']
    ];

    defaultCrews.forEach(crew => insertCrew.run(...crew));
    console.log('✅ Default crews initialized');
  }

  console.log('✅ Database initialized');
}

// Schedule CRUD operations
const schedules = {
  getAll() {
    return getDb().prepare('SELECT * FROM schedules ORDER BY start_date').all();
  },

  getByProjectId(projectId) {
    return getDb().prepare('SELECT * FROM schedules WHERE project_id = ?').get(projectId);
  },

  upsert(schedule) {
    const stmt = getDb().prepare(`
      INSERT INTO schedules (project_id, start_date, days, crew, notes, created_by, updated_at)
      VALUES (@project_id, @start_date, @days, @crew, @notes, @created_by, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id) DO UPDATE SET
        start_date = @start_date,
        days = @days,
        crew = @crew,
        notes = @notes,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(schedule);
  },

  delete(projectId) {
    return getDb().prepare('DELETE FROM schedules WHERE project_id = ?').run(projectId);
  }
};

// Crew operations
const crews = {
  getAll() {
    return getDb().prepare('SELECT * FROM crews WHERE active = 1 ORDER BY location, name').all();
  },

  getByLocation(location) {
    return getDb().prepare('SELECT * FROM crews WHERE location = ? AND active = 1').all(location);
  },

  update(id, data) {
    const stmt = getDb().prepare(`
      UPDATE crews SET name = ?, location = ?, roofers = ?, electricians = ?, color = ? WHERE id = ?
    `);
    return stmt.run(data.name, data.location, data.roofers, data.electricians, data.color, id);
  }
};

// Activity logging
function logActivity(action, projectId, userEmail, details) {
  getDb().prepare(`
    INSERT INTO activity_log (action, project_id, user_email, details) VALUES (?, ?, ?, ?)
  `).run(action, projectId, userEmail, JSON.stringify(details));
}

module.exports = { initialize, getDb, schedules, crews, logActivity };
