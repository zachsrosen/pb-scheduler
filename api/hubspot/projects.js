const { Client } = require('@hubspot/api-client');

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

const STAGE_MAP = {
    'ready_to_build': 'rtb',
    'rtb_blocked': 'blocked',
    'construction': 'construction',
    'inspection': 'inspection',
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
          const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
          const { location } = req.query;
          const properties = Object.values(PROPERTY_MAP);
          const filterGroups = [{ filters: [{ propertyName: 'dealstage', operator: 'IN', values: Object.keys(STAGE_MAP) }] }];
          if (location && location !== 'All') {
                  filterGroups.push({ filters: [{ propertyName: 'pb_location', operator: 'EQ', value: location }] });
          }

      const response = await hubspotClient.crm.deals.searchApi.doSearch({
              filterGroups, properties, limit: 100,
              sorts: [{ propertyName: 'amount', direction: 'DESCENDING' }]
      });

      const projects = response.results.map(deal => ({
              id: deal.id,
              name: deal.properties[PROPERTY_MAP.name] || '',
              amount: parseFloat(deal.properties[PROPERTY_MAP.amount]) || 0,
              stage: STAGE_MAP[deal.properties[PROPERTY_MAP.stage]] || deal.properties[PROPERTY_MAP.stage],
              address: deal.properties[PROPERTY_MAP.address] || '',
              location: deal.properties[PROPERTY_MAP.location] || '',
              systemSize: parseFloat(deal.properties[PROPERTY_MAP.systemSize]) || null,
              batteries: parseInt(deal.properties[PROPERTY_MAP.batteries]) || 0,
              crew: deal.properties[PROPERTY_MAP.crew] || null,
              daysInstall: parseInt(deal.properties[PROPERTY_MAP.daysInstall]) || 2,
              daysElec: parseInt(deal.properties[PROPERTY_MAP.daysElec]) || 1,
              scheduleDate: deal.properties[PROPERTY_MAP.scheduleDate] || null,
              hubspotUrl: `https://app.hubspot.com/contacts/21710069/record/0-3/${deal.id}`
      }));

      res.json({ success: true, total: response.total, projects });
    } catch (error) {
          res.status(500).json({ success: false, error: error.message, hint: 'Check HUBSPOT_ACCESS_TOKEN' });
    }
};
