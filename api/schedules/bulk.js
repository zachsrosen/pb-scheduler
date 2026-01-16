/**
 * Vercel Serverless Function: POST /api/schedules/bulk
 */

// Shared storage reference (note: in serverless, this resets on cold starts)
let schedulesStore = [];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
        return res.status(200).end();
  }

  if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
        const { schedules } = req.body;

      if (!Array.isArray(schedules)) {
              return res.status(400).json({ success: false, error: 'schedules array required' });
      }

      let saved = 0;
        schedules.forEach(schedule => {
                const idx = schedulesStore.findIndex(s => s.project_id === schedule.project_id);
                const record = {
                          project_id: schedule.project_id,
                          start_date: schedule.start_date,
                          days: schedule.days || 2,
                          crew: schedule.crew || null,
                          notes: schedule.notes || 'Auto-scheduled',
                          updated_at: new Date().toISOString()
                };

                                if (idx >= 0) {
                                          schedulesStore[idx] = { ...schedulesStore[idx], ...record };
                                } else {
                                          record.id = schedulesStore.length + 1;
                                          record.created_at = new Date().toISOString();
                                          schedulesStore.push(record);
                                }
                saved++;
        });

      res.json({ success: true, saved });
  } catch (error) {
        res.status(500).json({ success: false, error: error.message });
  }
}
