/**
 * Vercel Serverless Function: GET /api/hubspot/projects
 *
 * Query params:
 *   - location: Filter by PB location (optional)
 *   - debug: If 'true', returns raw deal stages for debugging
 */

import { Client } from '@hubspot/api-client';

const PROPERTY_MAP = {
  name: 'dealname',
  amount: 'amount',
  stage: 'dealstage',
  address: 'property_address',
  location: 'pb_location',
  systemSize: 'system_size_kwdc',
  batteries: 'number_of_batteries',
  batteryModel: 'battery_model',
  crew: 'install_crew',
  daysInstall: 'install_days_on_site',
  daysElec: 'electrical_install_days',
  roofType: 'roof_type',
  scheduleDate: 'install_schedule_date',
  type: 'service_line'
};

// Friendly stage labels for display
const STAGE_LABELS = {
  'rtb': 'Ready to Build',
  'blocked': 'RTB Blocked',
  'construction': 'Construction',
  'inspection': 'Inspection',
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
    const { location, debug } = req.query;
    const properties = Object.values(PROPERTY_MAP);

    // Debug mode: get sample deals to see what stages exist
    if (debug === 'true') {
      const sampleResponse = await hubspotClient.crm.deals.searchApi.doSearch({
        filterGroups: [],
        properties: ['dealname', 'dealstage', 'amount'],
        limit: 50,
        sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }]
      });

      // Get unique stages
      const stages = {};
      sampleResponse.results.forEach(deal => {
        const stage = deal.properties.dealstage;
        if (stage && !stages[stage]) {
          stages[stage] = {
            count: 1,
            sampleDeal: deal.properties.dealname
          };
        } else if (stage) {
          stages[stage].count++;
        }
      });

      return res.json({
        success: true,
        message: 'Debug mode - showing deal stages found',
        totalDeals: sampleResponse.total,
        stages
      });
    }

    // Normal mode: fetch deals without stage filter to get all deals
    const filterGroups = [];

    if (location && location !== 'All') {
      filterGroups.push({
        filters: [
          { propertyName: 'pb_location', operator: 'EQ', value: location }
        ]
      });
    }

    const searchRequest = {
      properties,
      limit: 100,
      sorts: [{ propertyName: 'amount', direction: 'DESCENDING' }]
    };

    if (filterGroups.length > 0) {
      searchRequest.filterGroups = filterGroups;
    }

    const response = await hubspotClient.crm.deals.searchApi.doSearch(searchRequest);

    const projects = response.results.map(deal => ({
      id: deal.id,
      name: deal.properties[PROPERTY_MAP.name] || '',
      amount: parseFloat(deal.properties[PROPERTY_MAP.amount]) || 0,
      stage: deal.properties[PROPERTY_MAP.stage] || 'unknown',
      stageLabel: STAGE_LABELS[deal.properties[PROPERTY_MAP.stage]] || deal.properties[PROPERTY_MAP.stage],
      address: deal.properties[PROPERTY_MAP.address] || '',
      location: deal.properties[PROPERTY_MAP.location] || '',
      systemSize: parseFloat(deal.properties[PROPERTY_MAP.systemSize]) || null,
      batteries: parseInt(deal.properties[PROPERTY_MAP.batteries]) || 0,
      batteryModel: deal.properties[PROPERTY_MAP.batteryModel] || null,
      crew: deal.properties[PROPERTY_MAP.crew] || null,
      daysInstall: parseInt(deal.properties[PROPERTY_MAP.daysInstall]) || 2,
      daysElec: parseInt(deal.properties[PROPERTY_MAP.daysElec]) || 1,
      roofType: deal.properties[PROPERTY_MAP.roofType] || null,
      scheduleDate: deal.properties[PROPERTY_MAP.scheduleDate] || null,
      type: deal.properties[PROPERTY_MAP.type] || '',
      hubspotUrl: `https://app.hubspot.com/contacts/${process.env.HUBSPOT_PORTAL_ID || '21710069'}/record/0-3/${deal.id}`
    }));

    res.json({ success: true, total: response.total, projects });
  } catch (error) {
    console.error('HubSpot API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check your HUBSPOT_ACCESS_TOKEN environment variable'
    });
  }
}
