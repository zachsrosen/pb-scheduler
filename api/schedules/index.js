/**
 * Vercel Serverless Function: /api/schedules
 * GET - Get all schedules
 * POST - Create/update schedule
 */

// In-memory storage for serverless (will reset on cold starts)
// For production, use a database like Vercel KV, Planetscale, or Supabase
let schedulesStore = [];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
        return res.status(200).end();
  }

  if (req.method === 'GET') {
        // Return all schedules
      const sorted = [...schedulesStore].sort((a, b) =>
              new Date(a.start_date) - new Date(b.start_date)
                                                  );
        return res.json({ success: true, schedules: sorted });
  }

  if (req.method === 'POST') {
        try {
                const { project_id, start_date, days, crew, notes } = req.body;

          if (!project_id || !start_date) {
                    return res.status(400).json({
                                success: false,
                                error: 'project_id and start_date are required'
                    });
          }

          // Upsert schedule
          const idx = schedulesStore.findIndex(s => s.project_id === project_id);
                const schedule = {
                          project_id,
                          start_date,
                          days: days || 2,
                          crew: crew || null,
                          notes: notes || null,
                          updated_at: new Date().toISOString()
                };

          if (idx >= 0) {
                    schedulesStore[idx] = { ...schedulesStore[idx], ...schedule };
          } else {
                    schedule.id = schedulesStore.length + 1;
                    schedule.created_at = new Date().toISOString();
                    schedulesStore.push(schedule);
          }

          return res.json({
                    success: true,
                    message: 'Schedule saved',
                    schedule: schedulesStore.find(s => s.project_id === project_id)
          });
        } catch (error) {
                return res.status(500).json({ success: false, error: error.message });
        }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
