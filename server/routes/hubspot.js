/**
 * HubSpot API Routes
 * Fetches projects from HubSpot deals
 */

const express = require('express');
const router = express.Router();
const { Client } = require('@hubspot/api-client');

// Initialize HubSpot client
const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Property mappings - adjust these to match your HubSpot deal properties
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

// Stage mappings - map HubSpot stage IDs to display names
const STAGE_MAP = {
  // Colorado pipeline stages - adjust these IDs to match your HubSpot
  'ready_to_build': 'rtb',
  'rtb_blocked': 'blocked',
  'construction': 'construction',
  'inspection': 'inspection',
  // Add your actual HubSpot stage IDs here
};

// Get all projects from HubSpot
router.get('/projects', async (req, res) => {
  try {
    const { location, stage } = req.query;

    // Properties to fetch from HubSpot
    const properties = Object.values(PROPERTY_MAP);

    // Build filter
    const filterGroups = [];

    // Filter by pipeline stages we care about (RTB, RTB-Blocked, Construction)
    filterGroups.push({
      filters: [
        { propertyName: 'dealstage', operator: 'IN', values: Object.keys(STAGE_MAP) }
      ]
    });

    // Location filter
    if (location && location !== 'All') {
      filterGroups.push({
        filters: [
          { propertyName: 'pb_location', operator: 'EQ', value: location }
        ]
      });
    }

    const response = await hubspotClient.crm.deals.searchApi.doSearch({
      filterGroups,
      properties,
      limit: 100,
      sorts: [{ propertyName: 'amount', direction: 'DESCENDING' }]
    });

    // Transform HubSpot data to our format
    const projects = response.results.map(deal => ({
      id: deal.id,
      name: deal.properties[PROPERTY_MAP.name] || '',
      amount: parseFloat(deal.properties[PROPERTY_MAP.amount]) || 0,
      stage: STAGE_MAP[deal.properties[PROPERTY_MAP.stage]] || deal.properties[PROPERTY_MAP.stage],
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

    res.json({
      success: true,
      total: response.total,
      projects
    });

  } catch (error) {
    console.error('HubSpot API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check your HUBSPOT_ACCESS_TOKEN in .env'
    });
  }
});

// Get single project
router.get('/projects/:id', async (req, res) => {
  try {
    const properties = Object.values(PROPERTY_MAP);
    const deal = await hubspotClient.crm.deals.basicApi.getById(req.params.id, properties);

    res.json({
      success: true,
      project: {
        id: deal.id,
        name: deal.properties[PROPERTY_MAP.name],
        // ... map other properties
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project schedule in HubSpot
router.patch('/projects/:id/schedule', async (req, res) => {
  try {
    const { scheduleDate, crew } = req.body;

    await hubspotClient.crm.deals.basicApi.update(req.params.id, {
      properties: {
        [PROPERTY_MAP.scheduleDate]: scheduleDate,
        [PROPERTY_MAP.crew]: crew
      }
    });

    res.json({ success: true, message: 'Schedule updated in HubSpot' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test HubSpot connection
router.get('/test', async (req, res) => {
  try {
    const response = await hubspotClient.crm.deals.basicApi.getPage(1);
    res.json({
      success: true,
      message: 'HubSpot connection successful',
      sampleDeal: response.results[0]?.properties?.dealname || 'No deals found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Make sure HUBSPOT_ACCESS_TOKEN is set correctly'
    });
  }
});

module.exports = router;
