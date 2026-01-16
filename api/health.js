/**
 * Vercel Serverless Function: GET /api/health
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

  res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local'
  });
}
