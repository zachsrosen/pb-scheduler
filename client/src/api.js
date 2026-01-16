/**
 * API client for PB Scheduler backend
 */

const API_BASE = '/api';

// Fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// HubSpot API
export const hubspot = {
  async getProjects(location = 'All') {
    const params = location !== 'All' ? `?location=${encodeURIComponent(location)}` : '';
    return fetchAPI(`/hubspot/projects${params}`);
  },

  async testConnection() {
    return fetchAPI('/hubspot/test');
  },

  async updateProjectSchedule(projectId, scheduleDate, crew) {
    return fetchAPI(`/hubspot/projects/${projectId}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ scheduleDate, crew })
    });
  }
};

// Schedules API (local database)
export const schedules = {
  async getAll() {
    return fetchAPI('/schedules');
  },

  async get(projectId) {
    return fetchAPI(`/schedules/${projectId}`);
  },

  async save(schedule) {
    return fetchAPI('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
  },

  async saveBulk(schedulesArray) {
    return fetchAPI('/schedules/bulk', {
      method: 'POST',
      body: JSON.stringify({ schedules: schedulesArray })
    });
  },

  async delete(projectId) {
    return fetchAPI(`/schedules/${projectId}`, { method: 'DELETE' });
  },

  async getCrews() {
    return fetchAPI('/schedules/config/crews');
  },

  async getActivityLog(limit = 50) {
    return fetchAPI(`/schedules/activity/log?limit=${limit}`);
  }
};

// Health check
export async function checkHealth() {
  return fetchAPI('/health');
}

export default { hubspot, schedules, checkHealth };
