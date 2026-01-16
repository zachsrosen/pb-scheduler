/**
 * Schedule Management Routes
 * CRUD operations for schedule assignments stored locally
 */

const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all schedules
router.get('/', (req, res) => {
  try {
    const schedules = db.schedules.getAll();
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedule for specific project
router.get('/:projectId', (req, res) => {
  try {
    const schedule = db.schedules.getByProjectId(req.params.projectId);
    if (schedule) {
      res.json({ success: true, schedule });
    } else {
      res.status(404).json({ success: false, error: 'Schedule not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update schedule
router.post('/', (req, res) => {
  try {
    const { project_id, start_date, days, crew, notes, sync_hubspot } = req.body;

    if (!project_id || !start_date) {
      return res.status(400).json({
        success: false,
        error: 'project_id and start_date are required'
      });
    }

    // Save to local database
    const result = db.schedules.upsert({
      project_id,
      start_date,
      days: days || 2,
      crew: crew || null,
      notes: notes || null,
      created_by: req.session?.user?.email || 'anonymous'
    });

    // Log activity
    db.logActivity('schedule_created', project_id, req.session?.user?.email, {
      start_date, days, crew
    });

    res.json({
      success: true,
      message: 'Schedule saved',
      schedule: db.schedules.getByProjectId(project_id)
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update schedules (for auto-optimize)
router.post('/bulk', (req, res) => {
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ success: false, error: 'schedules array required' });
    }

    let saved = 0;
    schedules.forEach(schedule => {
      db.schedules.upsert({
        project_id: schedule.project_id,
        start_date: schedule.start_date,
        days: schedule.days || 2,
        crew: schedule.crew || null,
        notes: schedule.notes || 'Auto-scheduled',
        created_by: req.session?.user?.email || 'auto-optimize'
      });
      saved++;
    });

    db.logActivity('bulk_schedule', null, req.session?.user?.email, {
      count: saved,
      action: 'auto-optimize'
    });

    res.json({ success: true, saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete schedule
router.delete('/:projectId', (req, res) => {
  try {
    const result = db.schedules.delete(req.params.projectId);

    db.logActivity('schedule_deleted', req.params.projectId, req.session?.user?.email, {});

    res.json({ success: true, deleted: result.changes > 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all crews
router.get('/config/crews', (req, res) => {
  try {
    const crews = db.crews.getAll();

    // Group by location
    const grouped = crews.reduce((acc, crew) => {
      if (!acc[crew.location]) acc[crew.location] = [];
      acc[crew.location].push(crew);
      return acc;
    }, {});

    res.json({ success: true, crews: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activity log
router.get('/activity/log', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.getDb().prepare(`
      SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?
    `).all(limit);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
