/**
 * Vercel Serverless Function: GET /api/schedules/config/crews
 */

const defaultCrews = [
  { id: 1, name: 'WESTY Alpha', location: 'Westminster', roofers: 2, electricians: 1, color: '#3b82f6' },
  { id: 2, name: 'WESTY Bravo', location: 'Westminster', roofers: 2, electricians: 1, color: '#10b981' },
  { id: 3, name: 'DTC Alpha', location: 'Centennial', roofers: 2, electricians: 1, color: '#8b5cf6' },
  { id: 4, name: 'DTC Bravo', location: 'Centennial', roofers: 2, electricians: 1, color: '#ec4899' },
  { id: 5, name: 'COSP Alpha', location: 'Colorado Springs', roofers: 3, electricians: 1, color: '#f97316' },
  { id: 6, name: 'SLO Solar', location: 'San Luis Obispo', roofers: 2, electricians: 1, color: '#06b6d4' },
  { id: 7, name: 'SLO Electrical 1', location: 'San Luis Obispo', roofers: 0, electricians: 2, color: '#a855f7' },
  { id: 8, name: 'SLO Electrical 2', location: 'San Luis Obispo', roofers: 0, electricians: 2, color: '#14b8a6' },
  { id: 9, name: 'CAM Crew', location: 'Camarillo', roofers: 2, electricians: 1, color: '#f43f5e' },
  { id: 10, name: 'SBA Alpha', location: 'Santa Barbara', roofers: 2, electricians: 1, color: '#eab308' },
  { id: 11, name: 'SBA Bravo', location: 'Santa Barbara', roofers: 2, electricians: 1, color: '#84cc16' }
  ];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
        return res.status(200).end();
  }

  if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
        // Group by location
      const grouped = defaultCrews.reduce((acc, crew) => {
              if (!acc[crew.location]) acc[crew.location] = [];
              acc[crew.location].push(crew);
              return acc;
      }, {});

      res.json({ success: true, crews: grouped });
  } catch (error) {
        res.status(500).json({ success: false, error: error.message });
  }
}
