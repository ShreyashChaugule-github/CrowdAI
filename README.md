# CrowdFlow AI Dashboard

A full-stack web application for real-time crowd management in stadiums, featuring AI-powered chat responses.

## Project Structure

```
crowdflow_ai_dashboard/
├── frontend/
│   ├── index.html          # Main HTML page
│   ├── css/
│   │   └── dashboard.css   # Styles for the dashboard
│   └── js/
│       └── dashboard.js    # Frontend JavaScript for rendering and API calls
├── backend/
│   ├── server.js           # Express server
│   ├── routes/
│   │   └── data.js         # API routes for data and chat
│   └── package.json        # Backend dependencies
└── README.md               # This file
```

## Components

### Frontend Components
- **Dashboard Layout**: Main UI with stats, heatmap, alerts, routes, and chat
- **Heatmap Renderer**: Visualizes crowd density zones on SVG stadium map
- **Stats Cards**: Display occupancy, wait times, alerts, and crowd score
- **Wait Times Panel**: Shows current wait times for facilities
- **Alerts Panel**: Displays smart alerts for crowd management
- **Routes Panel**: Suggests optimal routes with ETAs
- **Sparkline Chart**: Hourly crowd flow visualization
- **Chat Interface**: AI-powered chat for user queries

### Backend Components
- **Data Simulation**: Simulates real-time crowd data updates
- **API Endpoints**:
  - `/api/zones`: Crowd density zones
  - `/api/wait-times`: Facility wait times
  - `/api/alerts`: Active alerts
  - `/api/routes`: Route suggestions
  - `/api/sparkline`: Hourly flow data
  - `/api/stats`: Overall statistics
  - `/api/chat`: AI chat responses
- **Chat Processor**: Handles natural language queries about crowd data

## Setup

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server runs on http://localhost:3000

2. **Frontend**:
   Open `frontend/index.html` in a browser, or serve it with a static server.

## Features

- Real-time data simulation
- Interactive stadium heatmap
- AI chat with contextual responses
- Responsive design
- Live updates every 2.8 seconds