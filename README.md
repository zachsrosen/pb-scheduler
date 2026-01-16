# ⚡ Photon Brothers Master Scheduler

A real-time installation scheduling tool that connects directly to HubSpot for live project data.

## Features

- **Live HubSpot Integration** - Projects sync automatically from your HubSpot deals
- **Visual Calendar** - Month, Week, and Gantt views for schedule planning
- **Drag & Drop Scheduling** - Easy project assignment to dates and crews
- **Auto-Optimize** - One-click scheduling based on revenue priority
- **Conflict Detection** - Automatic alerts for crew double-bookings
- **Team Access** - Multiple users can view and edit schedules
- **Export Options** - CSV, iCal, clipboard copy

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- A HubSpot account with deal data
- npm or yarn

### 1. Clone & Install

```bash
# Navigate to the app directory
cd pb-scheduler-app

# Install all dependencies
npm run setup
```

### 2. Configure HubSpot

1. Go to HubSpot → Settings → Integrations → Private Apps
2. Click "Create a private app"
3. Name it "PB Scheduler"
4. Under Scopes, enable:
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
5. Click "Create app" and copy the access token

### 3. Set Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your token
HUBSPOT_ACCESS_TOKEN=pat-na1-your-token-here
SESSION_SECRET=generate-a-random-string
```

### 4. Run Locally

```bash
# Start both server and client
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Deployment Options

### Option A: Vercel (Recommended - Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Option B: Railway (Simple)

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add environment variables
4. Railway auto-detects Node.js and deploys

### Option C: DigitalOcean App Platform

1. Create a new App in DigitalOcean
2. Connect your GitHub repo
3. Set environment variables
4. Deploy

### Option D: Self-Hosted (Docker)

```dockerfile
# Dockerfile included - just run:
docker build -t pb-scheduler .
docker run -p 3001:3001 --env-file .env pb-scheduler
```

---

## HubSpot Property Mapping

The app expects these deal properties. Update `server/routes/hubspot.js` if yours differ:

| App Field | HubSpot Property | Description |
|-----------|-----------------|-------------|
| name | `dealname` | Project name (PROJ-XXXX \| Customer) |
| amount | `amount` | Deal value |
| stage | `dealstage` | Pipeline stage ID |
| address | `property_address` | Install address |
| location | `pb_location` | PB Location (Westminster, etc.) |
| systemSize | `system_size_kwdc` | Solar system size |
| batteries | `number_of_batteries` | Battery count |
| crew | `install_crew` | Assigned crew name |
| scheduleDate | `install_schedule_date` | Scheduled install date |

### Stage Mapping

Edit `STAGE_MAP` in `server/routes/hubspot.js` to match your pipeline:

```javascript
const STAGE_MAP = {
  'your_rtb_stage_id': 'rtb',
  'your_blocked_stage_id': 'blocked',
  'your_construction_stage_id': 'construction',
};
```

---

## Project Structure

```
pb-scheduler-app/
├── server/                 # Backend API
│   ├── index.js           # Express server
│   ├── database.js        # SQLite setup
│   └── routes/
│       ├── hubspot.js     # HubSpot API integration
│       └── schedules.js   # Schedule CRUD
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── api.js         # API client
│   │   └── components/    # UI components
│   └── vite.config.js
├── database/              # SQLite database (auto-created)
├── .env.example           # Environment template
└── package.json
```

---

## API Endpoints

### HubSpot
- `GET /api/hubspot/projects` - Fetch all projects
- `GET /api/hubspot/projects/:id` - Get single project
- `PATCH /api/hubspot/projects/:id/schedule` - Update schedule in HubSpot
- `GET /api/hubspot/test` - Test HubSpot connection

### Schedules
- `GET /api/schedules` - Get all local schedules
- `POST /api/schedules` - Create/update schedule
- `POST /api/schedules/bulk` - Bulk update (auto-optimize)
- `DELETE /api/schedules/:projectId` - Remove schedule
- `GET /api/schedules/config/crews` - Get crew configurations

---

## Customization

### Adding New Crews

Edit the crews table in the database or update defaults in `server/database.js`:

```javascript
const defaultCrews = [
  ['New Crew Name', 'Location', rooferCount, electricianCount, '#hexcolor'],
  // ...
];
```

### Changing Colors/Theme

Edit CSS variables in `client/src/styles.css`:

```css
:root {
  --accent: #f97316;  /* Main accent color */
  --rtb: #10b981;     /* Ready to Build */
  --construction: #3b82f6;  /* In Construction */
  /* ... */
}
```

---

## Troubleshooting

### "HubSpot connection failed"
- Check your `HUBSPOT_ACCESS_TOKEN` in `.env`
- Ensure the token has `crm.objects.deals.read` scope
- Verify the token hasn't expired

### "No projects showing"
- Check that your deals have the `pb_location` property set
- Verify the `dealstage` IDs match your `STAGE_MAP`
- Run `GET /api/hubspot/test` to debug

### Database errors
- Delete `database/scheduler.db` and restart to reset
- Check write permissions on the database directory

---

## Support

Questions? Contact the dev team or open an issue in the repo.

Built with ❤️ for Photon Brothers
