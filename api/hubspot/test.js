/**
 * Vercel Serverless Function: GET /api/hubspot/test
 * Tests HubSpot API connection
 */

import { Client } from '@hubspot/api-client';

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
        const token = process.env.HUBSPOT_ACCESS_TOKEN;

      if (!token) {
              return res.json({
                        success: false,
                        error: 'HUBSPOT_ACCESS_TOKEN not configured',
                        hint: 'Add this environment variable in Vercel project settings'
              });
      }

      const hubspotClient = new Client({ accessToken: token });

      // Try to get account info to test connection
      const response = await hubspotClient.crm.deals.searchApi.doSearch({
              filterGroups: [],
              properties: ['dealname'],
              limit: 1
      });

      res.json({
              success: true,
              message: 'HubSpot connection successful',
              totalDeals: response.total
      });
  } catch (error) {
        res.status(500).json({
                success: false,
                error: error.message,
                hint: 'Check if HUBSPOT_ACCESS_TOKEN is valid'
        });
  }
}
